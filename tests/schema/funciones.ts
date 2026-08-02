/**
 * Clasificación de todas las funciones del esquema `public`.
 *
 * Existe porque una lista de comprobaciones escrita a mano se queda obsoleta en
 * cuanto alguien añade una función: la prueba sigue en verde y la función nueva
 * nadie la ha mirado. Aquí la prueba falla si aparece una sin clasificar, así
 * que añadir una obliga a decidir quién puede ejecutarla.
 *
 * `ejecuta` es la lista EXACTA de roles con EXECUTE, ordenada. `[]` significa
 * que no la puede llamar nadie desde la API: solo el propietario, o el motor
 * cuando es un disparador o la evalúa una política.
 */
export type Categoria =
  | 'rpc-visitante'
  | 'rpc-cliente'
  | 'rpc-agente'
  | 'auxiliar'
  | 'trigger'

export interface Clasificacion {
  categoria: Categoria
  ejecuta: string[]
  /**
   * Parámetros que la función puede recibir aunque parezcan sensibles, con el
   * motivo. Sin esta lista habría que excluir la función entera, y entonces un
   * `p_agente_id` añadido mañana pasaría inadvertido.
   */
  parametrosPermitidos?: Record<string, string>
}

export const FUNCIONES: Record<string, Clasificacion> = {
  // ---- Visitante: sin cuenta, con sesión anónima --------------------------
  abrir_conversacion: { categoria: 'rpc-visitante', ejecuta: ['anon', 'authenticated'] },
  enviar_mensaje_visitante: { categoria: 'rpc-visitante', ejecuta: ['anon', 'authenticated'] },
  // La valoración la envía el visitante, que puede ser anónimo o tener cuenta.
  enviar_valoracion: { categoria: 'rpc-visitante', ejecuta: ['anon', 'authenticated'] },

  // ---- Cliente con cuenta -------------------------------------------------
  actualizar_mi_ficha: { categoria: 'rpc-cliente', ejecuta: ['authenticated'] },
  registrar_mi_justificante: { categoria: 'rpc-cliente', ejecuta: ['authenticated'] },
  crear_mis_reservas: { categoria: 'rpc-cliente', ejecuta: ['authenticated'] },
  cancelar_mi_reserva: { categoria: 'rpc-cliente', ejecuta: ['authenticated'] },
  vincular_mi_visitante_a_cliente: { categoria: 'rpc-cliente', ejecuta: ['authenticated'] },
  posicion_en_cola: { categoria: 'rpc-cliente', ejecuta: ['authenticated'] },

  // ---- Agente -------------------------------------------------------------
  cambiar_mi_estado: { categoria: 'rpc-agente', ejecuta: ['authenticated'] },
  asignarme_conversacion: { categoria: 'rpc-agente', ejecuta: ['authenticated'] },
  liberar_mi_conversacion: { categoria: 'rpc-agente', ejecuta: ['authenticated'] },
  cerrar_conversacion: { categoria: 'rpc-agente', ejecuta: ['authenticated'] },
  reabrir_conversacion: { categoria: 'rpc-agente', ejecuta: ['authenticated'] },
  responder_como_agente: { categoria: 'rpc-agente', ejecuta: ['authenticated'] },
  cambiar_estado_reserva: { categoria: 'rpc-agente', ejecuta: ['authenticated'] },
  revisar_descuento_educativo: {
    categoria: 'rpc-agente',
    ejecuta: ['authenticated'],
    parametrosPermitidos: {
      p_cliente_id:
        'El agente actúa sobre la ficha de OTRA persona, así que el destinatario ' +
        'tiene que venir por parámetro. Lo que la protege es es_agente(), no ' +
        'ocultar el identificador.',
    },
  },

  // ---- Auxiliares: nadie las llama desde fuera ----------------------------
  // `es_agente` es la excepción: las políticas la invocan y se evalúan con los
  // permisos de quien consulta, así que `authenticated` necesita EXECUTE.
  es_agente: { categoria: 'auxiliar', ejecuta: ['authenticated'] },
  es_supervisor: { categoria: 'auxiliar', ejecuta: [] },

  // ---- Disparadores -------------------------------------------------------
  touch_conversation_on_message: { categoria: 'trigger', ejecuta: [] },
  visitantes_protege_columnas: { categoria: 'trigger', ejecuta: [] },
}

/**
 * Nombres de parámetro que la sesión debe derivar y el cliente nunca enviar.
 *
 * Aceptar uno de estos es ofrecerle al servidor la respuesta a la pregunta que
 * tiene que comprobar.
 */
export const PARAMETROS_PROHIBIDOS = [
  'p_agente_id',
  'p_cliente_id',
  'p_visitor_id',
  'p_revisado_por',
  'p_autor',
  'p_created_at',
  'p_fecha',
  'p_uid',
  'p_usuario',
  'p_user_id',
]

/**
 * Funciones que trae la extensión `pgcrypto` y no son del proyecto. Se listan
 * para poder exigir que TODO lo demás esté clasificado.
 */
export const DE_EXTENSIONES = new Set([
  'armor',
  'crypt',
  'dearmor',
  'decrypt',
  'decrypt_iv',
  'digest',
  'encrypt',
  'encrypt_iv',
  'fips_mode',
  'gen_random_bytes',
  'gen_random_uuid',
  'gen_salt',
  'hmac',
  'pgp_armor_headers',
  'pgp_key_id',
  'pgp_pub_decrypt',
  'pgp_pub_decrypt_bytea',
  'pgp_pub_encrypt',
  'pgp_pub_encrypt_bytea',
  'pgp_sym_decrypt',
  'pgp_sym_decrypt_bytea',
  'pgp_sym_encrypt',
  'pgp_sym_encrypt_bytea',
])
