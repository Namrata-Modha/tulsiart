'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'

export async function addProduct(formData: FormData) {
  const supabase = createSupabaseAdminClient()

  const description = (formData.get('description') as string).trim() || null
  const quantity = parseInt(formData.get('quantity') as string, 10)
  const costPriceRaw = (formData.get('cost_price') as string).trim()
  const cost_price = costPriceRaw ? parseFloat(costPriceRaw) : null
  const images = formData.getAll('images') as File[]

  if (!images.length) throw new Error('At least one image is required.')

  // Generate name: ITEM-[padded count+1]-[timestamp]
  const { count, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
  if (countError) throw countError

  const num = String((count ?? 0) + 1).padStart(4, '0')
  const name = `ITEM-${num}-${Date.now()}`

  // Insert product row
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({ name, description, quantity, is_sold: false, cost_price })
    .select('id')
    .single()
  if (productError) throw productError

  // Upload images and insert rows
  for (let i = 0; i < images.length; i++) {
    const file = images[i]
    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const storagePath = `${product.id}/${i}-${Date.now()}.${ext}`

    const bytes = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(storagePath, bytes, { contentType: file.type, upsert: false })
    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(storagePath)

    const { error: imageRowError } = await supabase
      .from('product_images')
      .insert({
        product_id: product.id,
        image_url: urlData.publicUrl,
        is_cover: i === 0,
        display_order: i,
      })
    if (imageRowError) throw imageRowError
  }

  revalidatePath('/admin')
}

export async function markSold(productId: string, productName: string) {
  const supabase = createSupabaseAdminClient()

  // 1. Fetch non-cover images so we can delete them from storage
  const { data: nonCoverImages, error: fetchError } = await supabase
    .from('product_images')
    .select('image_url')
    .eq('product_id', productId)
    .eq('is_cover', false)
  if (fetchError) throw fetchError

  // 2. Delete non-cover files from storage
  if (nonCoverImages && nonCoverImages.length > 0) {
    const storagePaths = nonCoverImages
      .map((img) => {
        // URL format: .../storage/v1/object/public/product-images/<path>
        const marker = '/object/public/product-images/'
        const idx = img.image_url.indexOf(marker)
        return idx !== -1 ? img.image_url.slice(idx + marker.length) : null
      })
      .filter(Boolean) as string[]

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('product-images')
        .remove(storagePaths)
      if (storageError) throw storageError
    }
  }

  // 3. Delete non-cover rows from product_images table
  const { error: deleteImgError } = await supabase
    .from('product_images')
    .delete()
    .eq('product_id', productId)
    .eq('is_cover', false)
  if (deleteImgError) throw deleteImgError

  // 4. Mark the product as sold
  const { error: productError } = await supabase
    .from('products')
    .update({ is_sold: true })
    .eq('id', productId)
  if (productError) throw productError

  // 5. Log the sale
  const { error: salesError } = await supabase
    .from('sales')
    .insert({ product_id: productId, product_name: productName })
  if (salesError) throw salesError

  revalidatePath('/admin')
}

export async function editProduct(formData: FormData) {
  const supabase = createSupabaseAdminClient()

  const productId = formData.get('productId') as string
  const description = (formData.get('description') as string).trim() || null
  const quantity = parseInt(formData.get('quantity') as string, 10)
  const costPriceRaw = (formData.get('cost_price') as string).trim()
  const cost_price = costPriceRaw ? parseFloat(costPriceRaw) : null
  // Only treat as new images if files were actually selected (size > 0)
  const images = (formData.getAll('images') as File[]).filter((f) => f.size > 0)

  // 1. Update text fields
  const { error: updateError } = await supabase
    .from('products')
    .update({ description, quantity, cost_price })
    .eq('id', productId)
  if (updateError) throw updateError

  // 2. Replace photos if new ones were selected
  if (images.length > 0) {
    // Fetch existing image URLs for storage cleanup
    const { data: existingImages } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', productId)

    // Delete existing files from storage
    if (existingImages && existingImages.length > 0) {
      const storagePaths = existingImages
        .map((img) => {
          const marker = '/object/public/product-images/'
          const idx = img.image_url.indexOf(marker)
          return idx !== -1 ? img.image_url.slice(idx + marker.length) : null
        })
        .filter(Boolean) as string[]
      if (storagePaths.length > 0) {
        await supabase.storage.from('product-images').remove(storagePaths)
      }
    }

    // Delete existing product_images rows
    await supabase.from('product_images').delete().eq('product_id', productId)

    // Upload new images
    for (let i = 0; i < images.length; i++) {
      const file = images[i]
      const ext = file.type === 'image/png' ? 'png' : 'jpg'
      const storagePath = `${productId}/${i}-${Date.now()}.${ext}`

      const bytes = await file.arrayBuffer()
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(storagePath, bytes, { contentType: file.type, upsert: false })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(storagePath)

      const { error: imageRowError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: urlData.publicUrl,
          is_cover: i === 0,
          display_order: i,
        })
      if (imageRowError) throw imageRowError
    }
  }

  revalidatePath('/admin')
}

export async function saveSettings(
  _prevState: unknown,
  formData: FormData
): Promise<{ success?: true; error?: string }> {
  const supabase = createSupabaseAdminClient()

  const name = (formData.get('name') as string).trim()
  const contact_number = (formData.get('contact_number') as string).trim()
  const instructions = (formData.get('instructions') as string).trim() || null

  // Check for an existing row (there should be at most one)
  const { data: existing, error: fetchError } = await supabase
    .from('owner_info')
    .select('id')
    .limit(1)
    .maybeSingle()
  if (fetchError) return { error: fetchError.message }

  if (existing) {
    const { error } = await supabase
      .from('owner_info')
      .update({ name, contact_number, instructions })
      .eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('owner_info')
      .insert({ name, contact_number, instructions })
    if (error) return { error: error.message }
  }

  return { success: true }
}

export async function markAvailable(productId: string) {
  const supabase = createSupabaseAdminClient()

  // 1. Mark as available
  const { error: productError } = await supabase
    .from('products')
    .update({ is_sold: false })
    .eq('id', productId)
  if (productError) throw productError

  // 2. Remove the sales record
  const { error: salesError } = await supabase
    .from('sales')
    .delete()
    .eq('product_id', productId)
  if (salesError) throw salesError

  revalidatePath('/admin')
}
