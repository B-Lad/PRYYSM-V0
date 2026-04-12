
import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function ImageUpload({ onUpload }) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState("");

    async function handleUpload(e) {
        try {
            setUploading(true);
            const file = e.target.files[0];
            if (!file) return;

            // 1. Show local preview immediately
            setPreview(URL.createObjectURL(file));

            // 2. Create a unique file name
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 3. Upload to Supabase 'images' bucket
            const { error } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (error) throw error;

            // 4. Get the public URL
            const { data: publicUrlData } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            // 5. Send the URL back to the parent component
            if (onUpload) onUpload(publicUrlData.publicUrl);

        } catch (error) {
            console.error("Upload failed:", error.message);
            alert("Upload failed! Check console for details.");
        } finally {
            setUploading(false);
        }
    }

    return (
        <div style={{ marginTop: 10 }}>
            {preview ? (
                <img src={preview} alt="Preview" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
            ) : (
                <div style={{ width: 80, height: 80, borderRadius: 8, border: "2px dashed var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 20 }}>
                    📷
                </div>
            )}
            <label style={{ display: "block", marginTop: 6, cursor: "pointer", fontSize: 11, color: "var(--accent)" }}>
                {uploading ? "Uploading..." : "Upload Image"}
                <input type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} disabled={uploading} />
            </label>
        </div>
    );
}