"""
Envío de correos vía API HTTP de Brevo (antes Sendinblue).

Por qué: Railway bloquea/limita conexiones SMTP salientes en el puerto 587,
causando WORKER TIMEOUT en Gunicorn al intentar conectar a smtp.gmail.com.
La API HTTP de Brevo evita ese problema porque usa HTTPS (puerto 443),
que sí está permitido.
"""
import requests
from django.conf import settings

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def send_email_brevo(subject, html_content, to_email, text_content=None):
    """
    Envía un correo transaccional usando la API de Brevo.

    Args:
        subject: Asunto del correo
        html_content: Cuerpo en HTML
        to_email: Correo destino (string)
        text_content: Cuerpo en texto plano (opcional, fallback si no hay HTML)

    Returns:
        True si Brevo aceptó el envío (status 201), lanza excepción si falla.
    """
    headers = {
        "accept": "application/json",
        "api-key": settings.BREVO_API_KEY,
        "content-type": "application/json",
    }

    payload = {
        "sender": {
            "name": "Urban Store",
            "email": settings.BREVO_SENDER_EMAIL,
        },
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_content,
    }

    if text_content:
        payload["textContent"] = text_content

    response = requests.post(BREVO_API_URL, json=payload, headers=headers, timeout=10)

    if response.status_code != 201:
        # Lanza error con el detalle de Brevo para que quede en los logs de Railway
        raise Exception(f"Brevo error {response.status_code}: {response.text}")

    return True
