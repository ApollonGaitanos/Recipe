
import React, { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../supabaseClient';
import { Camera, X, Loader2, Image as ImageIcon } from 'lucide-react';

export default function PhotoUpload({ currentImage, onImageChange, recipeId }) {
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [preview, setPreview] = useState(currentImage);
    const fileInputRef = useRef(null);
    const [error, setError] = useState(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError(null);
        setUploading(true);

        try {
            // 1. Compression
            const options = {
                maxSizeMB: 0.2, // 200KB limit
                maxWidthOrHeight: 1200,
                useWebWorker: true,
                fileType: 'image/jpeg'
            };

            console.log('Original size:', file.size / 1024, 'KB');
            const compressedFile = await imageCompression(file, options);
            console.log('Compressed size:', compressedFile.size / 1024, 'KB');

            // 2. Get Presigned URL
            const { data, error: functionError } = await supabase.functions.invoke('upload-image', {
                body: {
                    filename: file.name,
                    filetype: compressedFile.type
                }
            });

            if (functionError) throw new Error("Failed to get upload URL");
            if (data.error) throw new Error(data.error);

            const { uploadUrl, publicUrl } = data;

            // 3. Upload to R2
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: compressedFile,
                headers: {
                    'Content-Type': compressedFile.type
                }
            });

            if (!uploadResponse.ok) {
                throw new Error("Failed to upload image provider");
            }

            // 4. Success
            setPreview(publicUrl);
            onImageChange(publicUrl); // Pass URL back to parent

        } catch (err) {
            console.error(err);
            setError(err.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = async (e) => {
        e.stopPropagation();

        // If it's a new recipe (not saved yet), just clear the UI
        if (!recipeId || recipeId === 'new') {
            setPreview(null);
            onImageChange(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Secure Server-Side Deletion
        setDeleting(true);
        setError(null);

        try {
            const { error } = await supabase.functions.invoke('delete-image', {
                body: {
                    recipeId: recipeId,
                    imageUrl: preview
                }
            });

            if (error) throw new Error(error.message || "Failed to delete image");

            // UI Cleanup after success
            setPreview(null);
            onImageChange(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (err) {
            console.error('Delete Error:', err);
            setError("Could not delete image. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div
            onClick={() => !uploading && !deleting && fileInputRef.current?.click()}
            className={`w-full aspect-[4/3] rounded-xl border-2 border-dashed 
                ${error ? 'border-red-300 bg-red-50' : 'border-[#dce5df] dark:border-[#2a4030] bg-gray-50 dark:bg-[#1a2c20]/50'}
                flex flex-col items-center justify-center cursor-pointer 
                hover:border-[#63886f] hover:bg-[#63886f]/5 transition-all overflow-hidden relative group`}
        >
            {uploading ? (
                <div className="flex flex-col items-center gap-3 text-[#63886f]">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-sm font-medium">Compressing & Uploading...</span>
                </div>
            ) : deleting ? (
                <div className="flex flex-col items-center gap-3 text-red-500">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-sm font-medium">Securely Deleting...</span>
                </div>
            ) : preview ? (
                <>
                    <img src={preview} alt="Recipe" className="w-full h-full object-cover" />
                    <button
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Photo"
                    >
                        <X size={16} />
                    </button>
                </>
            ) : (
                <div className="text-center p-6">
                    <div className="w-12 h-12 bg-[#e8f5e9] dark:bg-[#2a4030] rounded-full flex items-center justify-center mx-auto mb-3 text-[#63886f]">
                        <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors">
                        Upload Photo
                    </span>
                    {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
                </div>
            )}

            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}
