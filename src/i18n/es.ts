/**
 * Castellano — fuente de verdad de los textos de interfaz.
 *
 * Este objeto **define el tipo** de los demás idiomas (ver `src/lib/i18n.tsx`):
 * si se añade una clave aquí y falta en otro idioma, el build falla. Por eso
 * este fichero se toca primero y los otros cuatro después.
 *
 * Convenio de claves: `zona.elemento`. Se ordenan por zona, no alfabéticamente,
 * para que al traducir se lea seguido y se entienda el contexto.
 *
 * Aquí va **solo texto de interfaz**. El contenido comercial (titulares,
 * descripciones, condiciones) vive en `src/data/` y se traduce aparte.
 */
export const es = {
  // ---- Barra utilitaria y cabecera ----
  'header.utility.finder': 'Encuentra tu Apple',
  'header.utility.stores': 'Tiendas',
  'header.utility.business': 'Empresas',
  'header.utility.education': 'Educación',
  'header.utility.repair': 'Servicio técnico',
  'header.utility.support': 'Soporte',
  'header.search': 'Buscar',
  'header.searchPlaceholder': 'Buscar productos, accesorios…',
  'header.favorites': 'Favoritos',
  'header.compare': 'Comparador',
  'header.cart': 'Carrito',
  'header.account': 'Mi cuenta',
  'header.signIn': 'Iniciar sesión',
  'header.openMenu': 'Abrir menú',
  'header.closeMenu': 'Cerrar menú',
  'header.myStore': 'Mi tienda',
  'header.chooseStore': 'Elegir tienda favorita',
  'header.notifications': 'Avisos',
  'header.skipToContent': 'Saltar al contenido',
  'header.viewAll': 'Ver todos',

  // ---- Selector de idioma ----
  'lang.label': 'Idioma',
  'lang.choose': 'Elegir idioma',
  'lang.current': 'Idioma actual: {idioma}',

  // ---- Aviso de traducción demostrativa ----
  'lang.demoNotice.title': 'Traducción demostrativa',
  'lang.demoNotice.body':
    'Esta tienda es un prototipo. Los textos traducidos los ha generado la demostración, no Banana Computer. La versión válida es la española, sobre todo en garantía, financiación, seguro y Plan Renove.',
  'lang.demoNotice.switch': 'Ver en español',
  'lang.demoNotice.dismiss': 'Entendido',

  // ---- Pie de página ----
  'footer.contact': 'Contáctanos',
  'footer.supportCenter': 'Centro de soporte',
  'footer.ourStores': 'Nuestras tiendas',
  'footer.chatAndPhone': 'Chat y teléfono',
  'footer.aboutBanana': 'Más sobre Banana',
  'footer.aboutUs': 'Quiénes somos',
  'footer.business': 'Empresas',
  'footer.blog': 'Blog',
  'footer.helpAndServices': 'Ayuda y servicios',
  'footer.financing': 'Financiación',
  'footer.shipping': 'Envíos',
  'footer.tradeIn': 'Plan Renove',
  'footer.orderTracking': 'Seguimiento de pedido',
  'footer.repairService': 'Servicio técnico',
  'footer.purchaseTerms': 'Condiciones de compra',
  'footer.allProducts': 'Ver todos los productos',
  'footer.compare': 'Comparador',
  'footer.education': 'Educación',
  'footer.favoriteStore': 'Tienda favorita: {tienda}',

  // ---- Vocabulario común ----
  'common.addToCart': 'Añadir al carrito',
  'common.buy': 'Comprar',
  'common.reserve': 'Reservar',
  'common.seeMore': 'Más info',
  'common.discover': 'Descubrir',
  'common.back': 'Atrás',
  'common.next': 'Siguiente',
  'common.previous': 'Anterior',
  'common.close': 'Cerrar',
  'common.cancel': 'Cancelar',
  'common.save': 'Guardar',
  'common.accept': 'Aceptar',
  'common.continue': 'Continuar',
  'common.start': 'Empezar',
  'common.remove': 'Quitar',
  'common.loading': 'Cargando…',
  'common.notNow': 'Ahora no',
  'common.from': 'desde {precio}',
  'common.demoPrice': 'Precio demostrativo',
  'common.demoContent': 'Contenido demostrativo',

  // ---- Disponibilidad ----
  'availability.inStock': 'Disponible',
  'availability.backorder': 'Bajo pedido',
  'availability.soldOut': 'Agotado',
  'availability.openNow': 'Abierto ahora',
  'availability.closed': 'Cerrado',

  // ---- Buscador ----
  'search.title': 'Buscar',
  'search.placeholder': 'Busca productos, accesorios o ayuda',
  'search.noResults': 'No hemos encontrado nada para «{consulta}».',
  'search.suggestions': 'Sugerencias',
  'search.products': 'Productos',
  'search.accessories': 'Accesorios',
  'search.help': 'Ayuda',
  'search.didYouMean': '¿Querías decir «{sugerencia}»?',

  // ---- Carrito ----
  'cart.title': 'Carrito',
  'cart.empty': 'Tu carrito está vacío.',
  'cart.emptyAction': 'Ver el catálogo',
  'cart.subtotal': 'Subtotal',
  'cart.insurance': 'Seguro',
  'cart.total': 'Total',
  'cart.checkout': 'Tramitar pedido',
  'cart.quantity': 'Cantidad',
  'cart.units': '{n} unidades',
  'cart.unit': '1 unidad',

  // ---- Favoritos y comparador ----
  'favorites.title': 'Favoritos',
  'favorites.empty': 'Todavía no has guardado ningún favorito.',
  'favorites.add': 'Añadir a favoritos',
  'favorites.remove': 'Quitar de favoritos',
  'compare.title': 'Comparador',
  'compare.empty': 'Añade productos para compararlos.',
  'compare.add': 'Añadir al comparador',
  'compare.onlyDifferences': 'Solo diferencias',
  'compare.showAll': 'Mostrar todas',

  // ---- Cuenta ----
  'account.title': 'Mi cuenta',
  'account.signIn': 'Iniciar sesión',
  'account.signUp': 'Crear cuenta',
  'account.signOut': 'Cerrar sesión',
  'account.email': 'Email',
  'account.password': 'Contraseña',
  'account.name': 'Nombre',
  'account.phone': 'Teléfono',
  'account.orders': 'Mis pedidos',
  'account.reservations': 'Mis reservas',
  'account.shippingAddress': 'Dirección de envío',
  'account.billingAddress': 'Dirección de facturación',
  'account.educationDiscount': 'Descuento educativo',

  // ---- Navegación de la app ----
  'app.home': 'Inicio',
  'app.explore': 'Explorar',
  'app.categories': 'Categorías',
  'app.contactUs': 'Contacta con nosotros',
  'app.chatWithBananito': 'Chatea con Bananito',
  'app.chatSubtitle': 'Te responde una persona del equipo',
  'app.helpCenter': 'Centro de ayuda',
} as const
