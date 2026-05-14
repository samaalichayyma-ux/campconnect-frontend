package com.esprit.campconnect.Assurance.Service;

import com.esprit.campconnect.Assurance.DTO.AiProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiAssuranceService {

    private final AiProperties aiProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String askAi(String prompt) {
        if (aiProperties.getApiKey() == null || aiProperties.getApiKey().isBlank()) {
            throw new RuntimeException("Clé IA manquante. Vérifiez GROQ_API_KEY dans .env");
        }

        try {
            RestTemplate restTemplate = new RestTemplate();

            String url = "https://api.groq.com/openai/v1/chat/completions";

            Map<String, Object> body = Map.of(
                    "model", aiProperties.getModel(),
                    "messages", List.of(
                            Map.of("role", "system", "content", "Tu es un assistant IA spécialisé en assurance camping."),
                            Map.of("role", "user", "content", prompt)
                    ),
                    "temperature", 0.2
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(aiProperties.getApiKey());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            return extractText(response.getBody());

        } catch (Exception e) {
            throw new RuntimeException("Erreur IA : " + e.getMessage());
        }
    }

    private String extractText(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);

            JsonNode choices = root.get("choices");
            if (choices != null && choices.isArray() && choices.size() > 0) {
                JsonNode message = choices.get(0).get("message");
                if (message != null && message.has("content")) {
                    return message.get("content").asText();
                }
            }

            return responseBody;

        } catch (Exception e) {
            return responseBody;
        }
    }
}