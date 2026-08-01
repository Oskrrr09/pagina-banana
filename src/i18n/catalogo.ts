import type { Idioma } from '../lib/i18n'

/**
 * Textos del catálogo: reclamos de modelo, características y especificaciones.
 *
 * Van aparte de los diccionarios de interfaz por dos razones:
 *
 * 1. Son **datos de producto**, no rótulos. Viven en `src/data/products/` con
 *    su texto en castellano, que hace de identificador. Meter una clave al
 *    lado de cada uno serían cientos de ediciones en seis ficheros.
 * 2. Muchos **no se traducen a propósito**: «USB-C», «IP68», «Face ID» o
 *    «Apple M5» son nombres propios y se escriben igual en los cinco idiomas.
 *
 * Se indexa por el texto castellano y se guardan las otras cuatro versiones.
 * Lo que no esté aquí sale en castellano, y `tests/e2e/catalogo-i18n.spec.ts`
 * comprueba que no falte nada que sí debería estar.
 *
 * **Traducciones demostrativas**, como el resto del contenido.
 */

/** [inglés, alemán, francés, italiano] */
export type Traducciones = [string, string, string, string]

const ORDEN: Exclude<Idioma, 'es'>[] = ['en', 'de', 'fr', 'it']

export const CATALOGO: Record<string, Traducciones> = {
  // ---- Etiquetas de especificaciones ----
  'Pantalla': ['Display', 'Display', 'Écran', 'Display'],
  'Chip': ['Chip', 'Chip', 'Puce', 'Chip'],
  'Sistema de cámaras': ['Camera system', 'Kamerasystem', 'Système de caméras', 'Sistema di fotocamere'],
  'Conector': ['Connector', 'Anschluss', 'Connecteur', 'Connettore'],
  'Resistencia': ['Resistance', 'Beständigkeit', 'Résistance', 'Resistenza'],
  'Memoria': ['Memory', 'Speicher', 'Mémoire', 'Memoria'],
  'Conectividad': ['Connectivity', 'Konnektivität', 'Connectivité', 'Connettività'],
  'Sistema': ['System', 'System', 'Système', 'Sistema'],
  'Batería': ['Battery', 'Batterie', 'Batterie', 'Batteria'],
  'Autonomía': ['Battery life', 'Laufzeit', 'Autonomie', 'Autonomia'],
  'Audio': ['Audio', 'Audio', 'Audio', 'Audio'],
  'Cancelación de ruido': ['Noise cancellation', 'Geräuschunterdrückung', 'Réduction de bruit', 'Cancellazione del rumore'],
  'Caja': ['Case', 'Gehäuse', 'Boîtier', 'Cassa'],
  'Salud': ['Health', 'Gesundheit', 'Santé', 'Salute'],
  'Autenticación': ['Authentication', 'Authentifizierung', 'Authentification', 'Autenticazione'],
  'Formato': ['Format', 'Format', 'Format', 'Formato'],
  'Inteligencia': ['Intelligence', 'Intelligenz', 'Intelligence', 'Intelligenza'],
  'Accesorios': ['Accessories', 'Zubehör', 'Accessoires', 'Accessori'],

  // ---- Valores de especificaciones que sí son texto ----
  'Doble avanzado': ['Advanced dual', 'Fortschrittlich, dual', 'Double avancé', 'Doppio avanzato'],
  'Pro (triple)': ['Pro (triple)', 'Pro (dreifach)', 'Pro (triple)', 'Pro (tripla)'],
  'Activa': ['Active', 'Aktiv', 'Active', 'Attiva'],
  'Activa, mejorada': ['Active, improved', 'Aktiv, verbessert', 'Active, améliorée', 'Attiva, migliorata'],
  'Activa, en formato abierto': ['Active, open-ear', 'Aktiv, offenes Design', 'Active, format ouvert', 'Attiva, formato aperto'],
  'Espacial personalizado': ['Personalised Spatial', 'Personalisiertes Spatial', 'Spatial personnalisé', 'Spaziale personalizzato'],
  'Espacial con seguimiento de la cabeza': ['Spatial with head tracking', 'Spatial mit Kopfverfolgung', 'Spatial avec suivi de la tête', 'Spaziale con tracciamento della testa'],
  'Compatible con Apple Intelligence': ['Works with Apple Intelligence', 'Kompatibel mit Apple Intelligence', 'Compatible avec Apple Intelligence', 'Compatibile con Apple Intelligence'],
  'ECG, oxígeno en sangre, temperatura, apnea del sueño': ['ECG, blood oxygen, temperature, sleep apnoea', 'EKG, Blutsauerstoff, Temperatur, Schlafapnoe', 'ECG, oxygène sanguin, température, apnée du sommeil', 'ECG, ossigeno nel sangue, temperatura, apnea del sonno'],
  'Frecuencia cardiaca, detección de caídas': ['Heart rate, fall detection', 'Herzfrequenz, Sturzerkennung', 'Fréquence cardiaque, détection des chutes', 'Frequenza cardiaca, rilevamento cadute'],
  'Sensor de frecuencia cardiaca': ['Heart rate sensor', 'Herzfrequenzsensor', 'Capteur de fréquence cardiaque', 'Sensore di frequenza cardiaca'],
  'Aluminio (40 o 44 mm)': ['Aluminium (40 or 44 mm)', 'Aluminium (40 oder 44 mm)', 'Aluminium (40 ou 44 mm)', 'Alluminio (40 o 44 mm)'],
  'Aluminio o titanio (42 o 46 mm)': ['Aluminium or titanium (42 or 46 mm)', 'Aluminium oder Titan (42 oder 46 mm)', 'Aluminium ou titane (42 ou 46 mm)', 'Alluminio o titanio (42 o 46 mm)'],
  'Titanio 49 mm': ['49 mm titanium', 'Titan 49 mm', 'Titane 49 mm', 'Titanio 49 mm'],
  'No incluye': ['Not included', 'Nicht enthalten', 'Non inclus', 'Non incluso'],
  'Retina siempre activa': ['Always-On Retina', 'Always-On Retina', 'Retina toujours activé', 'Retina sempre attivo'],
  'Retina LTPO3 siempre activa': ['Always-On Retina LTPO3', 'Always-On Retina LTPO3', 'Retina LTPO3 toujours activé', 'Retina LTPO3 sempre attivo'],
  'Retina LTPO3, 3000 nits': ['Retina LTPO3, 3,000 nits', 'Retina LTPO3, 3000 Nits', 'Retina LTPO3, 3000 nits', 'Retina LTPO3, 3000 nit'],
  'Hasta 5 h (30 h con estuche)': ['Up to 5 h (30 h with case)', 'Bis zu 5 Std. (30 Std. mit Case)', "Jusqu'à 5 h (30 h avec le boîtier)", 'Fino a 5 h (30 h con la custodia)'],
  'Hasta 8 h (30 h con estuche)': ['Up to 8 h (30 h with case)', 'Bis zu 8 Std. (30 Std. mit Case)', "Jusqu'à 8 h (30 h avec le boîtier)", 'Fino a 8 h (30 h con la custodia)'],

  // ---- Características ----
  'Pantalla Super Retina XDR': ['Super Retina XDR display', 'Super Retina XDR Display', 'Écran Super Retina XDR', 'Display Super Retina XDR'],
  'Pantalla Liquid Retina XDR': ['Liquid Retina XDR display', 'Liquid Retina XDR Display', 'Écran Liquid Retina XDR', 'Display Liquid Retina XDR'],
  'Pantalla Liquid Retina 11"': ['11" Liquid Retina display', '11" Liquid Retina Display', 'Écran Liquid Retina 11"', 'Display Liquid Retina 11"'],
  'Pantalla Retina 4,5K': ['4.5K Retina display', '4,5K Retina Display', 'Écran Retina 4,5K', 'Display Retina 4,5K'],
  'Pantalla de 13 pulgadas': ['13-inch display', '13-Zoll-Display', 'Écran de 13 pouces', 'Display da 13 pollici'],
  'Pantalla siempre activa': ['Always-On display', 'Always-On Display', 'Écran toujours activé', 'Display sempre attivo'],
  'Ultra Retina XDR OLED': ['Ultra Retina XDR OLED', 'Ultra Retina XDR OLED', 'Ultra Retina XDR OLED', 'Ultra Retina XDR OLED'],
  'Sistema de cámaras Pro': ['Pro camera system', 'Pro Kamerasystem', 'Système de caméras Pro', 'Sistema di fotocamere Pro'],
  'Cámara avanzada de doble sistema': ['Advanced dual-camera system', 'Fortschrittliches Dual-Kamerasystem', 'Système à double caméra avancé', 'Sistema avanzato a doppia fotocamera'],
  'Cámara Center Stage': ['Center Stage camera', 'Center Stage Kamera', 'Caméra Cadre centré', 'Fotocamera Inquadratura automatica'],
  'Chip A19 Pro': ['A19 Pro chip', 'A19 Pro Chip', 'Puce A19 Pro', 'Chip A19 Pro'],
  'Chip A19': ['A19 chip', 'A19 Chip', 'Puce A19', 'Chip A19'],
  'Chip A17 Pro': ['A17 Pro chip', 'A17 Pro Chip', 'Puce A17 Pro', 'Chip A17 Pro'],
  'Chip Apple A16': ['Apple A16 chip', 'Apple A16 Chip', 'Puce Apple A16', 'Chip Apple A16'],
  'Chip Apple M4': ['Apple M4 chip', 'Apple M4 Chip', 'Puce Apple M4', 'Chip Apple M4'],
  'Chip Apple M5': ['Apple M5 chip', 'Apple M5 Chip', 'Puce Apple M5', 'Chip Apple M5'],
  'Chip M4 o M4 Pro': ['M4 or M4 Pro chip', 'M4 oder M4 Pro Chip', 'Puce M4 ou M4 Pro', 'Chip M4 o M4 Pro'],
  'Chip H2': ['H2 chip', 'H2 Chip', 'Puce H2', 'Chip H2'],
  'Chip S10': ['S10 chip', 'S10 Chip', 'Puce S10', 'Chip S10'],
  'Chip S11': ['S11 chip', 'S11 Chip', 'Puce S11', 'Chip S11'],
  'M4 Max o M3 Ultra': ['M4 Max or M3 Ultra', 'M4 Max oder M3 Ultra', 'M4 Max ou M3 Ultra', 'M4 Max o M3 Ultra'],
  'Batería para todo el día': ['All-day battery', 'Batterie für den ganzen Tag', 'Batterie toute la journée', 'Batteria per tutto il giorno'],
  'Autonomía para todo el día': ['All-day battery life', 'Laufzeit für den ganzen Tag', 'Autonomie toute la journée', 'Autonomia per tutto il giorno'],
  'Máxima autonomía': ['Maximum battery life', 'Maximale Laufzeit', 'Autonomie maximale', 'Massima autonomia'],
  'Hasta 18 h de autonomía': ['Up to 18 h battery life', 'Bis zu 18 Std. Laufzeit', "Jusqu'à 18 h d'autonomie", 'Fino a 18 h di autonomia'],
  'Hasta 20 h de batería': ['Up to 20 h battery', 'Bis zu 20 Std. Batterie', "Jusqu'à 20 h de batterie", 'Fino a 20 h di batteria'],
  'Hasta 24 h de batería': ['Up to 24 h battery', 'Bis zu 24 Std. Batterie', "Jusqu'à 24 h de batterie", 'Fino a 24 h di batteria'],
  'Hasta 42 h de batería': ['Up to 42 h battery', 'Bis zu 42 Std. Batterie', "Jusqu'à 42 h de batterie", 'Fino a 42 h di batteria'],
  'Diseño en titanio': ['Titanium design', 'Titan-Design', 'Design en titane', 'Design in titanio'],
  'Diseño compacto': ['Compact design', 'Kompaktes Design', 'Design compact', 'Design compatto'],
  'Diseño ligero': ['Lightweight design', 'Leichtes Design', 'Design léger', 'Design leggero'],
  'Diseño ultracompacto': ['Ultra-compact design', 'Ultrakompaktes Design', 'Design ultracompact', 'Design ultracompatto'],
  'Diseño sin ventilador': ['Fanless design', 'Lüfterloses Design', 'Design sans ventilateur', 'Design senza ventola'],
  'Diseño todo en uno': ['All-in-one design', 'All-in-One-Design', 'Design tout-en-un', 'Design all-in-one'],
  'Diadema de acero y aluminio': ['Steel and aluminium headband', 'Kopfbügel aus Stahl und Aluminium', 'Arceau en acier et aluminium', 'Archetto in acciaio e alluminio'],
  'El más fino y ligero': ['The thinnest and lightest', 'Am dünnsten und leichtesten', 'Le plus fin et le plus léger', 'Il più sottile e leggero'],
  'Ligero y sencillo': ['Light and simple', 'Leicht und einfach', 'Léger et simple', 'Leggero e semplice'],
  'Modelo más asequible': ['Most affordable model', 'Günstigstes Modell', 'Modèle le plus abordable', 'Modello più accessibile'],
  'Rendimiento profesional': ['Professional performance', 'Professionelle Leistung', 'Performances professionnelles', 'Prestazioni professionali'],
  'Alto rendimiento sostenido': ['Sustained high performance', 'Dauerhaft hohe Leistung', 'Hautes performances soutenues', 'Prestazioni elevate e costanti'],
  'Conectividad profesional': ['Professional connectivity', 'Professionelle Konnektivität', 'Connectivité professionnelle', 'Connettività professionale'],
  'Cancelación activa de ruido': ['Active noise cancellation', 'Aktive Geräuschunterdrückung', 'Réduction active du bruit', 'Cancellazione attiva del rumore'],
  'Audio Espacial': ['Spatial Audio', 'Spatial Audio', 'Audio spatial', 'Audio spaziale'],
  'Audio Espacial personalizado': ['Personalised Spatial Audio', 'Personalisiertes Spatial Audio', 'Audio spatial personnalisé', 'Audio spaziale personalizzato'],
  'Audio de alta fidelidad': ['High-fidelity audio', 'High-Fidelity-Audio', 'Audio haute-fidélité', 'Audio ad alta fedeltà'],
  'Ajuste abierto': ['Open-ear fit', 'Offener Sitz', 'Ajustement ouvert', 'Vestibilità aperta'],
  'Ajuste rediseñado': ['Redesigned fit', 'Neu gestalteter Sitz', 'Ajustement repensé', 'Vestibilità ridisegnata'],
  'Formato abierto': ['Open-ear design', 'Offenes Design', 'Format ouvert', 'Formato aperto'],
  'Estuche USB-C': ['USB-C case', 'USB-C Case', 'Boîtier USB-C', 'Custodia USB-C'],
  'Estuche USB-C con carga inalámbrica': ['USB-C case with wireless charging', 'USB-C Case mit kabellosem Laden', 'Boîtier USB-C avec recharge sans fil', 'Custodia USB-C con ricarica wireless'],
  'Botón de acción configurable': ['Customisable Action button', 'Konfigurierbare Action Taste', "Bouton Action configurable", 'Tasto Azione configurabile'],
  'Caja de titanio 49 mm': ['49 mm titanium case', 'Titangehäuse 49 mm', 'Boîtier en titane 49 mm', 'Cassa in titanio 49 mm'],
  'Detección de caídas': ['Fall detection', 'Sturzerkennung', 'Détection des chutes', 'Rilevamento cadute'],
  'Detección de apnea del sueño': ['Sleep apnoea detection', 'Schlafapnoe-Erkennung', "Détection de l'apnée du sommeil", 'Rilevamento apnea del sonno'],
  'ECG y oxígeno en sangre': ['ECG and blood oxygen', 'EKG und Blutsauerstoff', 'ECG et oxygène sanguin', 'ECG e ossigeno nel sangue'],
  'GPS de doble frecuencia': ['Dual-frequency GPS', 'Zweifrequenz-GPS', 'GPS double fréquence', 'GPS a doppia frequenza'],
  'Mensajes vía satélite': ['Messages via satellite', 'Nachrichten über Satellit', 'Messages par satellite', 'Messaggi via satellite'],
  'Aluminio o titanio': ['Aluminium or titanium', 'Aluminium oder Titan', 'Aluminium ou titane', 'Alluminio o titanio'],
  'Compatible con Apple Pencil Pro': ['Works with Apple Pencil Pro', 'Kompatibel mit Apple Pencil Pro', 'Compatible avec Apple Pencil Pro', 'Compatibile con Apple Pencil Pro'],
  'Cuatro colores': ['Four colours', 'Vier Farben', 'Quatre couleurs', 'Quattro colori'],
  'Cuatro colores vivos': ['Four vivid colours', 'Vier lebendige Farben', 'Quatre couleurs vives', 'Quattro colori vivaci'],
  'Tres colores': ['Three colours', 'Drei Farben', 'Trois couleurs', 'Tre colori'],
  'Dos tamaños': ['Two sizes', 'Zwei Größen', 'Deux tailles', 'Due misure'],
  'Dos tamaños: 11" y 13"': ['Two sizes: 11" and 13"', 'Zwei Größen: 11" und 13"', 'Deux tailles : 11" et 13"', 'Due misure: 11" e 13"'],
  'Hasta cinco pantallas': ['Up to five displays', 'Bis zu fünf Displays', "Jusqu'à cinq écrans", 'Fino a cinque display'],
  'Seis altavoces': ['Six speakers', 'Sechs Lautsprecher', 'Six haut-parleurs', 'Sei altoparlanti'],
  'Gigabit Ethernet': ['Gigabit Ethernet', 'Gigabit Ethernet', 'Gigabit Ethernet', 'Gigabit Ethernet'],
  'HDMI y SDXC': ['HDMI and SDXC', 'HDMI und SDXC', 'HDMI et SDXC', 'HDMI e SDXC'],

  "Hasta 20 h": ["Up to 20 h", "Bis zu 20 Std.", "Jusqu'à 20 h", "Fino a 20 h"],
  "Hasta 4 h (30 h con estuche)": ["Up to 4 h (30 h with case)", "Bis zu 4 Std. (30 Std. mit Case)", "Jusqu'à 4 h (30 h avec le boîtier)", "Fino a 4 h (30 h con la custodia)"],
  "Hasta 42 h (72 h en bajo consumo)": ["Up to 42 h (72 h in low power mode)", "Bis zu 42 Std. (72 Std. im Stromsparmodus)", "Jusqu'à 42 h (72 h en mode économie)", "Fino a 42 h (72 h in risparmio energetico)"],
  "GPS o GPS + Cellular": ["GPS or GPS + Cellular", "GPS oder GPS + Cellular", "GPS ou GPS + Cellular", "GPS o GPS + Cellular"],
  "GPS doble frecuencia · Cellular · Satélite": ["Dual-frequency GPS · Cellular · Satellite", "Zweifrequenz-GPS · Cellular · Satellit", "GPS double fréquence · Cellular · Satellite", "GPS a doppia frequenza · Cellular · Satellite"],

  // ---- Reclamos de modelo ----
  "El iPhone que buscas, al mejor precio en Canarias": ["The iPhone you want, at the best price in the Canary Islands", "Das iPhone, das du suchst, zum besten Preis auf den Kanaren", "L'iPhone que vous cherchez, au meilleur prix des Canaries", "L'iPhone che cerchi, al miglior prezzo delle Canarie"],
  "Titanio, A19 Pro y el sistema de cámaras más avanzado.": ["Titanium, A19 Pro and the most advanced camera system.", "Titan, A19 Pro und das fortschrittlichste Kamerasystem.", "Titane, A19 Pro et le système de caméras le plus avancé.", "Titanio, A19 Pro e il sistema di fotocamere più avanzato."],
  "La pantalla más grande y la mayor autonomía.": ["The largest display and the longest battery life.", "Das größte Display und die längste Laufzeit.", "Le plus grand écran et la plus grande autonomie.", "Il display più grande e la maggiore autonomia."],
  "El iPhone más fino y ligero, con chip A19.": ["The thinnest and lightest iPhone, with the A19 chip.", "Das dünnste und leichteste iPhone, mit A19 Chip.", "L'iPhone le plus fin et le plus léger, avec puce A19.", "L’iPhone più sottile e leggero, con chip A19."],
  "Subidón de color, con el chip A19.": ["A burst of colour, with the A19 chip.", "Ein Farbrausch, mit dem A19 Chip.", "Une explosion de couleur, avec la puce A19.", "Un’esplosione di colore, con il chip A19."],
  "Potencia de sobremesa y portátil": ["Desktop and laptop power", "Leistung für Schreibtisch und unterwegs", "Puissance de bureau et portable", "Potenza da scrivania e portatile"],
  "El portátil fino y ligero de Apple, ahora superpotenciado con M5.": ["Apple’s thin and light laptop, now supercharged with M5.", "Apples dünnes und leichtes Notebook, jetzt mit M5.", "Le portable fin et léger d’Apple, désormais boosté par M5.", "Il portatile sottile e leggero di Apple, ora potenziato con M5."],
  "Diseño ultrafino, gran autonomía y potencia M4 para todo el día.": ["Ultra-thin design, great battery life and M4 power all day.", "Ultradünnes Design, lange Laufzeit und M4 Leistung den ganzen Tag.", "Design ultrafin, grande autonomie et puissance M4 toute la journée.", "Design ultrasottile, grande autonomia e potenza M4 tutto il giorno."],
  "Rendimiento profesional M4 y pantalla Liquid Retina XDR.": ["M4 professional performance and a Liquid Retina XDR display.", "Professionelle M4 Leistung und Liquid Retina XDR Display.", "Performances professionnelles M4 et écran Liquid Retina XDR.", "Prestazioni professionali M4 e display Liquid Retina XDR."],
  "Todo en uno. Todo color. Una pantalla Retina 4,5K espectacular.": ["All in one. All colour. A spectacular 4.5K Retina display.", "Alles in einem. Voller Farbe. Ein spektakuläres 4,5K Retina Display.", "Tout-en-un. Tout en couleur. Un écran Retina 4,5K spectaculaire.", "Tutto in uno. Tutto colore. Uno spettacolare display Retina 4,5K."],
  "Un pequeño gigante con M4 para aprovechar tu pantalla y accesorios.": ["A small giant with M4 to make the most of your display and accessories.", "Ein kleiner Riese mit M4, um Display und Zubehör voll zu nutzen.", "Un petit géant avec M4 pour tirer parti de votre écran et vos accessoires.", "Un piccolo gigante con M4 per sfruttare display e accessori."],
  "Potencia de estudio profesional en un diseño increíblemente compacto.": ["Professional studio power in an incredibly compact design.", "Professionelle Studio-Leistung in unglaublich kompaktem Design.", "Puissance de studio professionnel dans un design incroyablement compact.", "Potenza da studio professionale in un design incredibilmente compatto."],
  "Potencia profesional de nueva generación para los proyectos más exigentes.": ["Next-generation professional power for the most demanding projects.", "Professionelle Leistung der nächsten Generation für anspruchsvollste Projekte.", "Puissance professionnelle nouvelle génération pour les projets les plus exigeants.", "Potenza professionale di nuova generazione per i progetti più esigenti."],
  "Un Mac ligero y accesible para estudiar, crear y trabajar cada día.": ["A light, accessible Mac to study, create and work every day.", "Ein leichter, erschwinglicher Mac zum Lernen, Gestalten und Arbeiten.", "Un Mac léger et accessible pour étudier, créer et travailler chaque jour.", "Un Mac leggero e accessibile per studiare, creare e lavorare ogni giorno."],
  "Versátil, ligero, para todo": ["Versatile, light, for everything", "Vielseitig, leicht, für alles", "Polyvalent, léger, pour tout", "Versatile, leggero, per tutto"],
  "Pantalla Ultra Retina XDR OLED y chip M5. Disponible en 11\" y 13\".": ["Ultra Retina XDR OLED display and M5 chip. Available in 11\" and 13\".", "Ultra Retina XDR OLED Display und M5 Chip. Erhältlich in 11\" und 13\".", "Écran Ultra Retina XDR OLED et puce M5. Disponible en 11\" et 13\".", "Display Ultra Retina XDR OLED e chip M5. Disponibile in 11\" e 13\"."],
  "Ligero, potente y con muchísimo color. Disponible en 11\" y 13\".": ["Light, powerful and full of colour. Available in 11\" and 13\".", "Leicht, leistungsstark und voller Farbe. Erhältlich in 11\" und 13\".", "Léger, puissant et plein de couleur. Disponible en 11\" et 13\".", "Leggero, potente e pieno di colore. Disponibile in 11\" e 13\"."],
  "El iPad para el día a día, en cuatro colores vivos.": ["The everyday iPad, in four vivid colours.", "Das iPad für jeden Tag, in vier lebendigen Farben.", "L’iPad du quotidien, en quatre couleurs vives.", "L’iPad di tutti i giorni, in quattro colori vivaci."],
  "Toda la potencia del iPad en un diseño superportátil de 8,3\".": ["All the power of iPad in an ultra-portable 8.3\" design.", "Die ganze iPad Power in einem superportablen 8,3\"-Design.", "Toute la puissance de l’iPad dans un design ultraportable de 8,3\".", "Tutta la potenza di iPad in un design superportatile da 8,3\"."],
  "Tu salud, en la muñeca": ["Your health, on your wrist", "Deine Gesundheit am Handgelenk", "Votre santé, à votre poignet", "La tua salute, al polso"],
  "La pantalla más grande y resistente, con nuevas funciones de salud.": ["The largest and toughest display, with new health features.", "Das größte und robusteste Display, mit neuen Gesundheitsfunktionen.", "L’écran le plus grand et le plus résistant, avec de nouvelles fonctions santé.", "Il display più grande e resistente, con nuove funzioni per la salute."],
  "Lo esencial del Apple Watch, ahora más asequible.": ["The essentials of Apple Watch, now more affordable.", "Das Wesentliche der Apple Watch, jetzt günstiger.", "L’essentiel de l’Apple Watch, désormais plus abordable.", "L’essenziale di Apple Watch, ora più accessibile."],
  "Titanio aeronáutico, GPS de doble frecuencia y la mayor autonomía.": ["Aerospace-grade titanium, dual-frequency GPS and the longest battery life.", "Titan in Luftfahrtqualität, Zweifrequenz-GPS und längste Laufzeit.", "Titane aéronautique, GPS double fréquence et la plus grande autonomie.", "Titanio aeronautico, GPS a doppia frequenza e la maggiore autonomia."],
  "Sonido sin cables": ["Wireless sound", "Klang ohne Kabel", "Le son sans fil", "Suono senza fili"],
  "La nueva generación con Chip H2 y Audio Espacial personalizado.": ["The new generation with the H2 chip and personalised Spatial Audio.", "Die neue Generation mit H2 Chip und personalisiertem Spatial Audio.", "La nouvelle génération avec puce H2 et audio spatial personnalisé.", "La nuova generazione con chip H2 e audio spaziale personalizzato."],
  "La mejor cancelación de ruido, ahora con sensor de frecuencia cardiaca.": ["The best noise cancellation, now with a heart rate sensor.", "Die beste Geräuschunterdrückung, jetzt mit Herzfrequenzsensor.", "La meilleure réduction de bruit, désormais avec capteur de fréquence cardiaque.", "La migliore cancellazione del rumore, ora con sensore di frequenza cardiaca."],
  "Ajuste abierto con cancelación activa de ruido y Audio Espacial.": ["Open-ear fit with active noise cancellation and Spatial Audio.", "Offener Sitz mit aktiver Geräuschunterdrückung und Spatial Audio.", "Ajustement ouvert avec réduction active du bruit et audio spatial.", "Vestibilità aperta con cancellazione attiva del rumore e audio spaziale."],
  "Sonido de altísima fidelidad en unos auriculares de diadema.": ["Ultra high-fidelity sound in over-ear headphones.", "Klang in höchster Wiedergabetreue in einem Over-Ear-Kopfhörer.", "Un son haute-fidélité dans un casque circum-auriculaire.", "Suono ad altissima fedeltà in cuffie over-ear."],
  "Fundas, cargadores y más": ["Cases, chargers and more", "Hüllen, Ladegeräte und mehr", "Coques, chargeurs et plus", "Custodie, caricatori e altro"],
}

/** Traduce un texto del catálogo. Lo que no esté, sale en castellano. */
export function traducirCatalogo(texto: string, idioma: Idioma): string {
  if (idioma === 'es') return texto
  const fila = CATALOGO[texto]
  if (!fila) return texto
  return fila[ORDEN.indexOf(idioma)] ?? texto
}
