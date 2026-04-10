import ssl
import certifi
from django.core.mail.backends.smtp import EmailBackend as SMTPBackend

class CustomEmailBackend(SMTPBackend):
    def open(self):
        if self.connection:
            return False
        try:
            connection_params = {}
            if self.timeout is not None:
                connection_params['timeout'] = self.timeout

            if self.use_ssl:
                self.connection = self.connection_class(
                    self.host, self.port, **connection_params
                )
            elif self.use_tls:
                self.connection = self.connection_class(
                    self.host, self.port, **connection_params
                )
                context = ssl.create_default_context(cafile=certifi.where())
                self.connection.starttls(context=context)
            else:
                self.connection = self.connection_class(
                    self.host, self.port, **connection_params
                )

            # 🔍 DEPURACIÓN: Imprimir usuario (ocultando contraseña)
            print(f"Intentando autenticar con usuario: {self.username}")
            print(f"Password presente: {'Sí' if self.password else 'No'}")

            if self.username and self.password:
                self.connection.login(self.username, self.password)
                print("Login exitoso")
            else:
                print("Faltan credenciales de autenticación")

            return True
        except Exception as e:
            print(f"Error en open(): {e}")
            if not self.fail_silently:
                raise
            return False