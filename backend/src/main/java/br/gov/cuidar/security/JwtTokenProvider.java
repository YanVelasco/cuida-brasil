package br.gov.cuidar.security;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProvider {
    @Value("${security.jwt.secret}") private String jwtSecret;
    @Value("${security.jwt.expiration-ms}") private long jwtExpirationMs;

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(java.util.Base64.getEncoder().encodeToString(jwtSecret.getBytes()));
        return Keys.hmacShaKeyFor(keyBytes);
    }
    public String generateToken(Long userId, String cpf, String nome, String perfil) {
        return Jwts.builder()
            .subject(cpf).claim("userId", userId).claim("nome", nome).claim("perfil", perfil)
            .issuedAt(new Date()).expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
            .signWith(getSigningKey()).compact();
    }
    public String getCpfFromToken(String token) { return parseClaims(token).getSubject(); }
    public String getPerfilFromToken(String token) { return parseClaims(token).get("perfil", String.class); }
    public Long getUserIdFromToken(String token) { return parseClaims(token).get("userId", Long.class); }
    public boolean validateToken(String token) {
        try { parseClaims(token); return true; } catch (JwtException | IllegalArgumentException e) { return false; }
    }
    private Claims parseClaims(String token) {
        return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload();
    }
}
