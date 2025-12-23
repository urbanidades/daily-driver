import { supabase } from './supabaseClient';

/**
 * Upload an image file to Supabase Storage and return the public URL.
 * @param {File} file - The file object to upload.
 * @returns {Promise<string|null>} - The public URL of the uploaded image, or null if failed.
 */
export async function uploadImage(file) {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('File is not an image');
      return null;
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to 'task-images' bucket
    const { error: uploadError } = await supabase.storage
      .from('task-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data } = supabase.storage
      .from('task-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}
