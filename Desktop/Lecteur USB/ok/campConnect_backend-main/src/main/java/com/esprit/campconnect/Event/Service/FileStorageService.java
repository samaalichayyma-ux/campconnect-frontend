package com.esprit.campconnect.Event.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class FileStorageService {

    @Value("${app.upload.dir:uploads/events}")
    private String uploadDir;

    @Value("${app.upload.max-size:10485760}") // 10MB default
    private long maxFileSize;

    private static final String[] ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"};
    private static final long BYTES_IN_MB = 1048576;

    /**
     * Store an uploaded file and return its path
     */
    public String storeFile(MultipartFile file) throws IOException {
        return storeFile(file, file.getBytes());
    }

    public String storeFile(String originalFilename, byte[] fileBytes) throws IOException {
        if (fileBytes == null || fileBytes.length == 0) {
            throw new IllegalArgumentException("File is empty");
        }

        if (fileBytes.length > maxFileSize) {
            throw new IllegalArgumentException(
                    "File size exceeds maximum allowed size of "
                            + (maxFileSize / BYTES_IN_MB) + "MB"
            );
        }

        if (originalFilename == null || !isAllowedExtension(originalFilename)) {
            throw new IllegalArgumentException("File type not allowed. Allowed types: jpg, jpeg, png, gif, webp");
        }

        Path uploadDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadDirectory);

        String fileExtension = getFileExtension(originalFilename);
        String uniqueFilename = UUID.randomUUID() + "." + fileExtension;
        Path filePath = uploadDirectory.resolve(uniqueFilename);
        Files.write(filePath, fileBytes);

        log.info("File stored successfully: {}", uniqueFilename);
        return filePath.toString();
    }

    /**
     * Store an uploaded file using already-read bytes and return its path
     */
    public String storeFile(MultipartFile file, byte[] fileBytes) throws IOException {
        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        // Check file size
        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException(
                    "File size exceeds maximum allowed size of " 
                    + (maxFileSize / BYTES_IN_MB) + "MB"
            );
        }

        // Check file extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !isAllowedExtension(originalFilename)) {
            throw new IllegalArgumentException("File type not allowed. Allowed types: jpg, jpeg, png, gif, webp");
        }

        // Create upload directory if it doesn't exist
        Path uploadDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadDirectory);

        // Generate unique filename
        String fileExtension = getFileExtension(originalFilename);
        String uniqueFilename = UUID.randomUUID() + "." + fileExtension;

        // Save file
        Path filePath = uploadDirectory.resolve(uniqueFilename);
        Files.write(filePath, fileBytes);

        log.info("File stored successfully: {}", uniqueFilename);
        return filePath.toString();
    }

    /**
     * Delete a stored file
     */
    public void deleteFile(String filePath) {
        try {
            Path path = Paths.get(filePath);
            Files.deleteIfExists(path);
            log.info("File deleted successfully: {}", filePath);
        } catch (IOException e) {
            log.error("Error deleting file: {}", filePath, e);
        }
    }

    /**
     * Check if file extension is allowed
     */
    private boolean isAllowedExtension(String filename) {
        String extension = getFileExtension(filename).toLowerCase();
        for (String allowed : ALLOWED_EXTENSIONS) {
            if (allowed.equals(extension)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Extract file extension from filename
     */
    private String getFileExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        if (lastDot > 0) {
            return filename.substring(lastDot + 1);
        }
        return "";
    }
}
