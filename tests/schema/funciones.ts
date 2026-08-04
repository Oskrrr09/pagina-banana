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
export type Categoria = 'rpc-visitante' | 'rpc-cliente' | 'rpc-agente' | 'auxiliar' | 'trigger'

export interface Clasificacion {
  categoria: Categoria
  ejecuta: string[]
  /** Todas las funciones del proyecto elevan privilegios de forma explícita. */
  securityDefiner: boolean
  /**
   * Parámetros que la función puede recibir aunque parezcan sensibles, con el
   * motivo. Sin esta lista habría que excluir la función entera, y entonces un
   * `p_agente_id` añadido mañana pasaría inadvertido.
   */
  parametrosPermitidos?: Record<string, string>
}

export const FUNCIONES: Record<string, Clasificacion> = {
  // ---- Visitante: sin cuenta, con sesión anónima --------------------------
  'abrir_conversacion(text,text,text,text)': {
    categoria: 'rpc-visitante',
    ejecuta: ['anon', 'authenticated'],
    securityDefiner: true,
  },
  'enviar_mensaje_visitante(uuid,text)': {
    categoria: 'rpc-visitante',
    ejecuta: ['anon', 'authenticated'],
    securityDefiner: true,
  },
  // La valoración la envía el visitante, que puede ser anónimo o tener cuenta.
  'enviar_valoracion(uuid,smallint,text)': {
    categoria: 'rpc-visitante',
    ejecuta: ['anon', 'authenticated'],
    securityDefiner: true,
  },

  // ---- Cliente con cuenta -------------------------------------------------
  'actualizar_mi_ficha(text,text,jsonb,jsonb)': {
    categoria: 'rpc-cliente',
    ejecuta: ['authenticated'],
    securityDefiner: true,
  },
  'registrar_mi_justificante(text)': {
    categoria: 'rpc-cliente',
    ejecuta: ['authenticated'],
    securityDefiner: true,
  },
  'crear_mis_reservas(jsonb)': {
    categoria: 'rpc-cliente',
    ejecuta: ['authenticated'],
    securityDefiner: true,
  },
  'cancelar_mi_reserva(uuid)': {
    categoria: 'rpc-cliente',
    ejecuta: ['authenticated'],
    securityDefiner: true,
  },
  'vincular_mi_visitante_a_cliente()': {
    categoria: 'rpc-cliente',
    ejecuta: ['authenticated'],
    securityDefiner: true,
  },
  'posicion_en_cola(uuid)': {
    categoria: 'rpc-cliente',
    ejecuta: ['authenticated'],
    securityDefiner: true,
  },

  // ---- Agente -------------------------------------------------------------
  'cambiar_mi_estado(text,text)': {
    categoria: 'rpc-agente',
    ejecuta: ['authenticated'],
    securityDefiner: true,
  },
  'asignarme_conversacion(uuid)': {
    categoria: 'rpc-agente',
    ejecuta: ['authenticated'],
    securityDefiner: true,
  },
  'liberar_mi_conversacion(uuid)': {
    categoria: 'rpc-agente',
    ejecuta: ['authenticated'],
    securityDefiner: true,
  },
  'cerrar_conversacion(uuid,boolean)': {
    categoria: 'rpc-agente',
    ejecuta: ['authenticated'],
    securityDefiner: true,
  },
  'reabrir_conversacion(uuid)': {
    categoria: 'rpc-agente',
    ejecuta: ['authenticated'],
    securityDefiner: true,
  },
  'responder_como_agente(uuid,text)': {
    categoria: 'rpc-agente',
    ejecuta: ['authenticated'],
    securityDefiner: true,
  },
  'cambiar_estado_reserva(uuid,text)': {
    categoria: 'rpc-agente',
    ejecuta: ['authenticated'],
    securityDefiner: true,
  },
  'revisar_descuento_educativo(uuid,text,text)': {
    categoria: 'rpc-agente',
    ejecuta: ['authenticated'],
    securityDefiner: true,
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
  'es_agente()': { categoria: 'auxiliar', ejecuta: ['authenticated'], securityDefiner: true },
  'es_supervisor()': { categoria: 'auxiliar', ejecuta: [], securityDefiner: true },

  // ---- Disparadores -------------------------------------------------------
  'touch_conversation_on_message()': { categoria: 'trigger', ejecuta: [], securityDefiner: true },
  'visitantes_protege_columnas()': { categoria: 'trigger', ejecuta: [], securityDefiner: true },
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
