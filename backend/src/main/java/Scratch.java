import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class Scratch {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println("Admin@123 -> " + encoder.encode("Admin@123"));
        System.out.println("Gestor@123 -> " + encoder.encode("Gestor@123"));
        System.out.println("Cidadao@123 -> " + encoder.encode("Cidadao@123"));
    }
}
