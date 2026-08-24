# CHARROPRO-HOSTINGER-TERMINAL-DEPLOY-001

Pipeline seguro de despliegue del cliente CharroPro mediante SSH, SCP y shell remoto. El flujo valida un paquete inmutable, crea backup, sube fuera del runtime, extrae en staging, aplica un overlay sin borrar extras, verifica build/checksum y ejecuta smoke HTTP.

No modifica producto, Firebase Functions, RTDB Rules ni datos productivos.

Primer deploy Terminal certificado: PASS. El pipeline queda listo para uso operativo; la sincronizacion Git automatica existente en Hostinger se documenta como riesgo separado.
