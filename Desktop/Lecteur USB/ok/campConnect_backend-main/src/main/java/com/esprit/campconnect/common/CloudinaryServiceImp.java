package com.esprit.campconnect.common;

import com.cloudinary.Cloudinary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryServiceImp implements ICloudinaryService  {
    private final Cloudinary cloudinary;
    @Override
    public Map<String, String> uploadImage(MultipartFile file) {
        try {
            Map uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    Map.of("folder", "campconnect/site-camping")
            );

            String imageUrl = uploadResult.get("secure_url").toString();
            String imagePublicId = uploadResult.get("public_id").toString();

            return Map.of(
                    "imageUrl", imageUrl,
                    "imagePublicId", imagePublicId
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload image to Cloudinary", e);
        }
    }

    @Override
    public void deleteImage(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, Map.of());
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete image from Cloudinary", e);
        }
    }
}
