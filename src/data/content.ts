// Textos de marketing y datos de secundarias (apartado 7). Todo de ejemplo.

export const services = [
  {
    slug: 'financiacion',
    icon: 'credit-card',
    name: 'Financiación',
    line: 'Llévatelo hoy, págalo poco a poco.',
    note: 'Condiciones pendientes de validación',
  },
  {
    slug: 'envios',
    icon: 'truck',
    name: 'Envíos',
    line: 'Envío a toda Canarias y recogida gratuita en tienda.',
    note: 'Condiciones pendientes de validación',
  },
  {
    slug: 'plan-renove',
    icon: 'refresh',
    name: 'Plan Renove',
    line: 'Tu Apple actual vale más de lo que crees.',
    note: 'Contenido provisional',
  },
  {
    slug: 'seguro',
    icon: 'shield',
    name: 'Seguro a todo riesgo',
    line: 'Protege tu dispositivo desde el primer día.',
    note: 'Condiciones pendientes de validación',
  },
  {
    slug: 'educacion',
    icon: 'graduation',
    name: 'Descuento educativo',
    line: 'Ventajas para estudiantes y profesorado.',
    note: 'Condiciones pendientes de validación',
  },
]

export const advantages = [
  { icon: 'truck', title: 'Envío a toda Canarias', note: 'Condiciones pendientes de validación' },
  { icon: 'store', title: 'Recogida en tienda', note: 'Condiciones pendientes de validación' },
  { icon: 'star', title: 'Especialistas Apple', note: 'Contenido provisional' },
  { icon: 'shield', title: 'Seguro a todo riesgo', note: 'Condiciones pendientes de validación' },
]

export const homeFaq = [
  {
    q: '¿Cuánto tarda el envío entre islas?',
    a: 'Los pedidos a Canarias se entregan normalmente en 24/72h laborables. El plazo exacto depende de la isla de destino.',
    note: 'Condiciones pendientes de validación',
  },
  {
    q: '¿Puedo financiar mi compra?',
    a: 'Sí. Puedes simular tu cuota en la propia ficha de producto. La contratación de la financiación se completa hoy de forma presencial en tienda.',
    note: 'Condiciones pendientes de validación',
  },
  {
    q: '¿Cómo funciona el Plan Renove?',
    a: 'Llevas tu dispositivo actual a una tienda Banana, un especialista lo tasa y el descuento se aplica a tu nueva compra. La tasación es siempre presencial y orientativa online.',
    note: 'Contenido provisional',
  },
]

export const serviceFaq = [
  {
    q: '¿Cuánto tardan los envíos?',
    a: 'Entre 24 y 72h laborables en Canarias, según la isla.',
    note: 'Condiciones pendientes de validación',
  },
  {
    q: '¿Qué necesito para financiar?',
    a: 'DNI y una cuenta bancaria. El trámite se completa hoy de forma presencial en tienda.',
    note: 'Condiciones pendientes de validación',
  },
  {
    q: '¿La tasación del Plan Renove es online?',
    a: 'No. La valoración final la realiza un especialista en tienda; cualquier cifra online es solo orientativa.',
    note: 'Contenido provisional',
  },
]

export const planRenoveDevices = ['iPhone', 'iPad', 'Mac', 'Apple Watch']

export const planRenoveSteps = [
  'Lleva tu dispositivo a una tienda Banana.',
  'Un especialista lo tasa en el momento.',
  'El descuento se aplica directamente a tu nueva compra.',
]

export const planRenoveFaq = [
  {
    q: '¿Qué documentación necesito?',
    a: 'Tu DNI y el dispositivo que quieres entregar, a ser posible con su cargador.',
    note: 'Contenido provisional',
  },
  {
    q: '¿Cuánto tarda el proceso?',
    a: 'La tasación suele hacerse en la misma visita, en pocos minutos.',
    note: 'Contenido provisional',
  },
  {
    q: '¿Qué dispositivos no se admiten?',
    a: 'Dispositivos con daños graves o sin posibilidad de encenderse pueden no ser admitidos. El especialista lo confirma en tienda.',
    note: 'Contenido provisional',
  },
]

// Centro de soporte
export const supportQuickLinks = [
  { icon: 'package', title: 'Seguimiento de pedido', desc: 'Consulta el estado de tu compra.' },
  { icon: 'wrench', title: 'Iniciar reparación', desc: 'Servicio técnico en tienda.' },
  { icon: 'chat', title: 'Contactar', desc: 'Chat, teléfono o formulario.' },
  { icon: 'shield', title: 'Garantía', desc: 'Consulta la cobertura de tu producto.' },
]

export const supportTopics = [
  {
    topic: 'Pedidos',
    items: [
      { q: '¿Cómo sigo mi pedido?', a: 'Con el número de pedido que recibes por email tras la compra.', note: 'Contenido provisional' },
      { q: '¿Puedo cambiar la dirección de envío?', a: 'Sí, siempre que el pedido no haya salido de nuestro almacén.', note: 'Condiciones pendientes de validación' },
    ],
  },
  {
    topic: 'Envíos',
    items: [
      { q: '¿Enviáis fuera de Canarias?', a: 'El prototipo simula envíos dentro de Canarias.', note: 'Condiciones pendientes de validación' },
    ],
  },
  {
    topic: 'Garantía',
    items: [
      { q: '¿Cuánta garantía tiene mi producto?', a: 'La garantía legal aplicable a productos electrónicos.', note: 'Condiciones pendientes de validación' },
    ],
  },
  {
    topic: 'Pagos',
    items: [
      { q: '¿Qué métodos de pago aceptáis?', a: 'Tarjeta, Bizum y financiación (esta última se cierra en tienda).', note: 'Condiciones pendientes de validación' },
    ],
  },
  {
    topic: 'Reparaciones',
    items: [
      { q: '¿Cómo llevo mi equipo a reparar?', a: 'Elige una tienda con servicio técnico y acude con tu dispositivo.', note: 'Contenido provisional' },
    ],
  },
]
