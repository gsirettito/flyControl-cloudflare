import threading
from cache import periodic_cleanup
from endpoints import app

# Iniciar limpieza periódica del caché (cada 15 minutos)
threading.Timer(1, periodic_cleanup, args=(15,)).start()
