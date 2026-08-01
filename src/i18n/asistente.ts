import type { Traducciones } from './catalogo'

/**
 * Textos del asistente «Encuentra tu Apple»: preguntas, opciones, ayudas y
 * los motivos que el motor genera para justificar cada recomendación.
 *
 * Van indexados por el texto castellano, igual que el catálogo, y por la misma
 * razón: viven en `src/data/productDecisionData.ts`, que es un módulo de datos
 * puro —sin React, sin contexto de idioma— y meterle claves obligaría a
 * reescribir el motor de decisión entero para traducir unos rótulos.
 *
 * Ojo con lo que **no** está aquí: los `value` de cada opción («compacto»,
 * «trabajo», «si») son identificadores con los que el motor filtra y puntúa.
 * Traducir uno de esos rompería la recomendación en silencio —el filtro
 * dejaría de encontrar coincidencias y el asistente diría que ningún modelo
 * encaja—. Solo se traduce el `label`.
 *
 * **Traducciones demostrativas**, como el resto del contenido.
 */
export const ASISTENTE: Record<string, Traducciones> = {
  // ---- Preguntas ----
  '¿Para qué usas más el iPhone?': ['What do you use your iPhone for most?', 'Wofür nutzt du dein iPhone am meisten?', 'À quoi utilisez-vous le plus votre iPhone ?', 'Per cosa usi di più l’iPhone?'],
  '¿Qué tamaño prefieres?': ['What size do you prefer?', 'Welche Größe bevorzugst du?', 'Quelle taille préférez-vous ?', 'Che taglia preferisci?'],
  '¿Qué es lo que más te importa?': ['What matters most to you?', 'Was ist dir am wichtigsten?', 'Qu’est-ce qui compte le plus pour vous ?', 'Cosa ti interessa di più?'],
  '¿Cuál es el uso principal del Mac?': ['What will the Mac mainly be used for?', 'Wofür wird der Mac hauptsächlich genutzt?', 'Quel sera l’usage principal du Mac ?', 'Qual è l’uso principale del Mac?'],
  '¿Prefieres portátil o sobremesa?': ['Do you prefer a laptop or a desktop?', 'Bevorzugst du ein Notebook oder einen Desktop?', 'Préférez-vous un portable ou un ordinateur de bureau ?', 'Preferisci un portatile o un desktop?'],
  '¿Qué prima?': ['What takes priority?', 'Was hat Vorrang?', 'Qu’est-ce qui prime ?', 'Cosa conta di più?'],
  '¿Para qué lo vas a usar principalmente?': ['What will you mainly use it for?', 'Wofür wirst du es hauptsächlich nutzen?', 'À quoi allez-vous principalement l’utiliser ?', 'Per cosa lo userai principalmente?'],
  '¿Vas a usar Apple Pencil?': ['Will you use an Apple Pencil?', 'Wirst du den Apple Pencil nutzen?', 'Allez-vous utiliser l’Apple Pencil ?', 'Userai l’Apple Pencil?'],
  '¿Y teclado (Magic Keyboard)?': ['And a keyboard (Magic Keyboard)?', 'Und eine Tastatur (Magic Keyboard)?', 'Et un clavier (Magic Keyboard) ?', 'E la tastiera (Magic Keyboard)?'],
  '¿Para qué lo vas a usar?': ['What will you use it for?', 'Wofür wirst du es nutzen?', 'À quoi allez-vous l’utiliser ?', 'Per cosa lo userai?'],
  '¿Necesitas conexión sin llevar el iPhone?': ['Do you need a connection without carrying your iPhone?', 'Brauchst du eine Verbindung, ohne das iPhone dabeizuhaben?', 'Avez-vous besoin d’une connexion sans emporter votre iPhone ?', 'Ti serve la connessione senza portare l’iPhone?'],
  '¿Cuál es el uso principal?': ['What is the main use?', 'Was ist der Haupteinsatz?', 'Quel est l’usage principal ?', 'Qual è l’uso principale?'],
  '¿Qué tipo de ajuste prefieres?': ['What kind of fit do you prefer?', 'Welchen Sitz bevorzugst du?', 'Quel type d’ajustement préférez-vous ?', 'Che tipo di vestibilità preferisci?'],
  '¿Para qué lo utilizarás principalmente?': ['What will you mainly use it for?', 'Wofür wirst du es hauptsächlich verwenden?', 'À quoi l’utiliserez-vous principalement ?', 'Per cosa lo utilizzerai principalmente?'],
  '¿Qué tipo de producto necesitas?': ['What kind of product do you need?', 'Welche Art von Produkt brauchst du?', 'De quel type de produit avez-vous besoin ?', 'Che tipo di prodotto ti serve?'],
  '¿Qué tipo de trabajo realizarás principalmente?': ['What kind of work will you mainly do?', 'Welche Art von Arbeit wirst du hauptsächlich erledigen?', 'Quel type de travail réaliserez-vous principalement ?', 'Che tipo di lavoro farai principalmente?'],
  '¿Qué valoras más?': ['What do you value most?', 'Was schätzt du am meisten?', 'Qu’appréciez-vous le plus ?', 'Cosa apprezzi di più?'],
  '¿Necesitas que sea muy portable?': ['Does it need to be very portable?', 'Muss es sehr tragbar sein?', 'Faut-il qu’il soit très portable ?', 'Deve essere molto portatile?'],
  '¿Qué tan estricto es ese presupuesto?': ['How strict is that budget?', 'Wie strikt ist dieses Budget?', 'Ce budget est-il strict ?', 'Quanto è rigido quel budget?'],

  // ---- Ayudas de pregunta ----
  'Si es imprescindible, filtramos: portátil no propone iMac/Mac mini/Studio y viceversa.': ['If it is essential we filter: laptop will not suggest iMac/Mac mini/Studio, and vice versa.', 'Wenn es zwingend ist, filtern wir: Notebook schlägt kein iMac/Mac mini/Studio vor und umgekehrt.', 'Si c’est indispensable, nous filtrons : portable ne propose pas d’iMac/Mac mini/Studio, et inversement.', 'Se è indispensabile filtriamo: portatile non propone iMac/Mac mini/Studio e viceversa.'],
  '"Sí" descarta modelos sin compatibilidad Pencil.': ['“Yes” rules out models without Pencil support.', '„Ja“ schließt Modelle ohne Pencil-Unterstützung aus.', '« Oui » écarte les modèles sans compatibilité Pencil.', '«Sì» esclude i modelli senza compatibilità Pencil.'],
  '"Sí" descarta modelos sin teclado compatible.': ['“Yes” rules out models without a compatible keyboard.', '„Ja“ schließt Modelle ohne kompatible Tastatur aus.', '« Oui » écarte les modèles sans clavier compatible.', '«Sì» esclude i modelli senza tastiera compatibile.'],
  '"Sí" filtra los modelos que no ofrecen variante Cellular en el prototipo.': ['“Yes” filters out models with no Cellular version in the prototype.', '„Ja“ filtert Modelle heraus, die im Prototyp keine Cellular-Variante haben.', '« Oui » filtre les modèles sans version Cellular dans le prototype.', '«Sì» filtra i modelli senza variante Cellular nel prototipo.'],
  '"Abiertos" descarta Pro/Max; "In-ear" descarta AirPods 4 y Max; "De diadema" solo permite AirPods Max.': ['“Open” rules out Pro/Max; “In-ear” rules out AirPods 4 and Max; “Over-ear” allows only AirPods Max.', '„Offen“ schließt Pro/Max aus; „In-Ear“ schließt AirPods 4 und Max aus; „Over-Ear“ lässt nur AirPods Max zu.', '« Ouverts » écarte Pro/Max ; « Intra-auriculaires » écarte les AirPods 4 et Max ; « Circum-auriculaires » n’autorise que les AirPods Max.', '«Aperti» esclude Pro/Max; «In-ear» esclude AirPods 4 e Max; «Over-ear» ammette solo AirPods Max.'],
  'Nos ayuda a distinguir entre un equipo principal, un dispositivo móvil o un complemento.': ['It helps us tell apart a main machine, a mobile device and an accessory.', 'Das hilft uns, zwischen Hauptgerät, mobilem Gerät und Zubehör zu unterscheiden.', 'Cela nous aide à distinguer un équipement principal, un appareil mobile et un accessoire.', 'Ci aiuta a distinguere tra dispositivo principale, dispositivo mobile e accessorio.'],
  'Solo se pregunta cuando indicaste "Trabajo" como uso principal.': ['Only asked when you chose “Work” as the main use.', 'Wird nur gefragt, wenn du „Arbeit“ als Haupteinsatz gewählt hast.', 'Posée uniquement si vous avez choisi « Travail » comme usage principal.', 'Viene chiesto solo se hai indicato «Lavoro» come uso principale.'],

  // ---- Opciones ----
  'Uso cotidiano': ['Everyday use', 'Alltag', 'Usage quotidien', 'Uso quotidiano'],
  'Fotografía y vídeo': ['Photo and video', 'Foto und Video', 'Photo et vidéo', 'Foto e video'],
  'Trabajo': ['Work', 'Arbeit', 'Travail', 'Lavoro'],
  'Juegos': ['Gaming', 'Gaming', 'Jeux', 'Giochi'],
  'Redes sociales': ['Social media', 'Social Media', 'Réseaux sociaux', 'Social'],
  'Compacto': ['Compact', 'Kompakt', 'Compact', 'Compatto'],
  'Equilibrado': ['Balanced', 'Ausgewogen', 'Équilibré', 'Equilibrato'],
  'Grande': ['Large', 'Groß', 'Grand', 'Grande'],
  'Me da igual': ['No preference', 'Egal', 'Peu importe', 'Indifferente'],
  'Cámara': ['Camera', 'Kamera', 'Appareil photo', 'Fotocamera'],
  'Batería': ['Battery', 'Batterie', 'Batterie', 'Batteria'],
  'Potencia': ['Performance', 'Leistung', 'Puissance', 'Prestazioni'],
  'Ligereza': ['Light weight', 'Geringes Gewicht', 'Légèreté', 'Leggerezza'],
  'Precio': ['Price', 'Preis', 'Prix', 'Prezzo'],
  'Estudio y ofimática': ['Study and office work', 'Studium und Büro', 'Études et bureautique', 'Studio e ufficio'],
  'Programación': ['Programming', 'Programmieren', 'Programmation', 'Programmazione'],
  'Diseño': ['Design', 'Design', 'Design', 'Design'],
  'Trabajo profesional exigente': ['Demanding professional work', 'Anspruchsvolle professionelle Arbeit', 'Travail professionnel exigeant', 'Lavoro professionale impegnativo'],
  'Portátil (imprescindible)': ['Laptop (essential)', 'Notebook (zwingend)', 'Portable (indispensable)', 'Portatile (indispensabile)'],
  'Sobremesa (imprescindible)': ['Desktop (essential)', 'Desktop (zwingend)', 'Ordinateur de bureau (indispensable)', 'Desktop (indispensabile)'],
  'Ligereza y batería': ['Light weight and battery life', 'Gewicht und Akkulaufzeit', 'Légèreté et autonomie', 'Leggerezza e autonomia'],
  'Estudio': ['Study', 'Studium', 'Études', 'Studio'],
  'Consumo multimedia': ['Watching and listening', 'Medien konsumieren', 'Consommation multimédia', 'Contenuti multimediali'],
  'Dibujo': ['Drawing', 'Zeichnen', 'Dessin', 'Disegno'],
  'Edición': ['Editing', 'Bearbeitung', 'Montage', 'Montaggio'],
  'Sí (imprescindible)': ['Yes (essential)', 'Ja (zwingend)', 'Oui (indispensable)', 'Sì (indispensabile)'],
  'Quizás': ['Maybe', 'Vielleicht', 'Peut-être', 'Forse'],
  'No lo necesito': ['I don’t need it', 'Brauche ich nicht', 'Je n’en ai pas besoin', 'Non mi serve'],
  'No': ['No', 'Nein', 'Non', 'No'],
  'Salud': ['Health', 'Gesundheit', 'Santé', 'Salute'],
  'Deporte': ['Sport', 'Sport', 'Sport', 'Sport'],
  'Aventura y deporte extremo': ['Adventure and extreme sport', 'Abenteuer und Extremsport', 'Aventure et sport extrême', 'Avventura e sport estremi'],
  'Sí, Cellular imprescindible': ['Yes, Cellular is essential', 'Ja, Cellular ist zwingend', 'Oui, Cellular indispensable', 'Sì, Cellular indispensabile'],
  'No, con GPS me vale': ['No, GPS is enough', 'Nein, GPS reicht mir', 'Non, le GPS me suffit', 'No, mi basta il GPS'],
  'Autonomía': ['Battery life', 'Laufzeit', 'Autonomie', 'Autonomia'],
  'Sensores y salud': ['Sensors and health', 'Sensoren und Gesundheit', 'Capteurs et santé', 'Sensori e salute'],
  'Música': ['Music', 'Musik', 'Musique', 'Musica'],
  'Llamadas': ['Calls', 'Anrufe', 'Appels', 'Chiamate'],
  'Viajes y trabajo (ANC)': ['Travel and work (ANC)', 'Reisen und Arbeit (ANC)', 'Voyages et travail (ANC)', 'Viaggi e lavoro (ANC)'],
  'Abiertos, sin almohadilla': ['Open, without ear tips', 'Offen, ohne Aufsatz', 'Ouverts, sans embout', 'Aperti, senza gommino'],
  'In-ear, con almohadillas': ['In-ear, with ear tips', 'In-Ear, mit Aufsätzen', 'Intra-auriculaires, avec embouts', 'In-ear, con gommini'],
  'De diadema': ['Over-ear', 'Over-Ear', 'Circum-auriculaires', 'Over-ear'],
  'Escuchar música o podcasts': ['Listening to music or podcasts', 'Musik oder Podcasts hören', 'Écouter de la musique ou des podcasts', 'Ascoltare musica o podcast'],
  'Salud y deporte': ['Health and sport', 'Gesundheit und Sport', 'Santé et sport', 'Salute e sport'],
  'Un equipo principal para realizar mis tareas.': ['A main machine for getting my work done.', 'Ein Hauptgerät für meine Aufgaben.', 'Un équipement principal pour réaliser mes tâches.', 'Un dispositivo principale per svolgere i miei compiti.'],
  'Un dispositivo móvil para llevar siempre conmigo.': ['A mobile device to carry with me all the time.', 'Ein mobiles Gerät, das ich immer dabeihabe.', 'Un appareil mobile à emporter partout.', 'Un dispositivo mobile da portare sempre con me.'],
  'Un complemento, como auriculares o reloj.': ['An accessory, such as headphones or a watch.', 'Ein Zubehör, etwa Kopfhörer oder eine Uhr.', 'Un accessoire, comme des écouteurs ou une montre.', 'Un accessorio, come cuffie o un orologio.'],
  'No estoy seguro.': ['I’m not sure.', 'Ich bin nicht sicher.', 'Je ne suis pas sûr.', 'Non sono sicuro.'],
  'Ofimática, correo y videollamadas.': ['Office work, email and video calls.', 'Büroarbeit, E-Mail und Videoanrufe.', 'Bureautique, e-mail et visioconférence.', 'Ufficio, email e videochiamate.'],
  'Programación o aplicaciones de escritorio.': ['Programming or desktop applications.', 'Programmieren oder Desktop-Anwendungen.', 'Programmation ou applications de bureau.', 'Programmazione o applicazioni desktop.'],
  'Diseño, fotografía o edición de vídeo.': ['Design, photography or video editing.', 'Design, Fotografie oder Videobearbeitung.', 'Design, photographie ou montage vidéo.', 'Design, fotografia o montaggio video.'],
  'Gestiones rápidas mientras me desplazo.': ['Quick tasks while I’m on the move.', 'Schnelle Erledigungen unterwegs.', 'Des tâches rapides en déplacement.', 'Attività rapide mentre mi sposto.'],
  'Todavía no lo sé.': ['I don’t know yet.', 'Weiß ich noch nicht.', 'Je ne sais pas encore.', 'Non lo so ancora.'],
  'Portabilidad': ['Portability', 'Tragbarkeit', 'Portabilité', 'Portabilità'],
  'Sí, lo llevaré siempre encima': ['Yes, I’ll carry it everywhere', 'Ja, ich habe es immer dabei', 'Oui, je l’emporterai partout', 'Sì, lo porterò sempre con me'],
  'No, será para casa/oficina': ['No, it will stay at home or the office', 'Nein, es bleibt zu Hause oder im Büro', 'Non, il restera à la maison ou au bureau', 'No, resterà a casa o in ufficio'],
  'Es mi máximo': ['That’s my limit', 'Das ist mein Maximum', 'C’est mon maximum', 'È il mio massimo'],
  'Podría subir un poco (10–15 %)': ['I could go a little higher (10–15%)', 'Ich könnte etwas höher gehen (10–15 %)', 'Je pourrais monter un peu (10–15 %)', 'Potrei salire un po’ (10–15%)'],
  'Solo es una referencia': ['It’s only a reference', 'Nur ein Richtwert', 'Ce n’est qu’une référence', 'È solo un riferimento'],
  'Sin límite': ['No limit', 'Ohne Limit', 'Sans limite', 'Senza limite'],

  // ---- Motivos por familia ----
  'Mac es el equipo natural para trabajar.': ['Mac is the natural machine for work.', 'Der Mac ist das natürliche Gerät zum Arbeiten.', 'Le Mac est l’équipement naturel pour travailler.', 'Il Mac è il dispositivo naturale per lavorare.'],
  'iPad puede encajar como alternativa portátil de trabajo.': ['iPad can work as a portable alternative for work.', 'Das iPad kann als portable Arbeitsalternative dienen.', 'L’iPad peut convenir comme alternative portable pour travailler.', 'L’iPad può funzionare come alternativa portatile per lavorare.'],
  'AirPods como complemento de trabajo para llamadas y videoconferencias.': ['AirPods as a work accessory for calls and video meetings.', 'AirPods als Arbeitszubehör für Anrufe und Videokonferenzen.', 'Des AirPods comme accessoire de travail pour les appels et visioconférences.', 'AirPods come accessorio di lavoro per chiamate e videoconferenze.'],
  'iPad se adapta muy bien al estudio.': ['iPad suits studying very well.', 'Das iPad passt sehr gut zum Studium.', 'L’iPad s’adapte très bien aux études.', 'L’iPad si adatta molto bene allo studio.'],
  'Mac también funciona para estudiar.': ['Mac also works for studying.', 'Der Mac eignet sich auch zum Studieren.', 'Le Mac fonctionne aussi pour étudier.', 'Anche il Mac va bene per studiare.'],
  'AirPods como complemento para escuchar clases o concentrarte.': ['AirPods as an accessory for lectures or for concentrating.', 'AirPods als Zubehör für Vorlesungen oder zum Konzentrieren.', 'Des AirPods comme accessoire pour suivre des cours ou se concentrer.', 'AirPods come accessorio per seguire lezioni o concentrarti.'],
  'El iPhone es el mejor punto de captura del catálogo.': ['iPhone is the best capture device in the catalogue.', 'Das iPhone ist das beste Aufnahmegerät im Katalog.', 'L’iPhone est le meilleur outil de capture du catalogue.', 'L’iPhone è il miglior strumento di ripresa del catalogo.'],
  'El Mac es la opción para editar en escritorio.': ['Mac is the option for editing at a desk.', 'Der Mac ist die Wahl fürs Bearbeiten am Schreibtisch.', 'Le Mac est l’option pour monter au bureau.', 'Il Mac è la scelta per il montaggio alla scrivania.'],
  'iPad ayuda a editar sobre la marcha.': ['iPad helps you edit on the move.', 'Das iPad hilft beim Bearbeiten unterwegs.', 'L’iPad aide à monter en déplacement.', 'L’iPad aiuta a montare in mobilità.'],
  'Para escuchar música o podcasts, AirPods.': ['For music or podcasts, AirPods.', 'Für Musik oder Podcasts: AirPods.', 'Pour la musique ou les podcasts, des AirPods.', 'Per musica o podcast, AirPods.'],
  'El iPhone es el mando y fuente natural.': ['iPhone is the natural remote and source.', 'Das iPhone ist die natürliche Steuerung und Quelle.', 'L’iPhone est la télécommande et la source naturelle.', 'L’iPhone è il telecomando e la sorgente naturale.'],
  'Salud y deporte encajan con Apple Watch.': ['Health and sport fit Apple Watch.', 'Gesundheit und Sport passen zur Apple Watch.', 'Santé et sport correspondent à l’Apple Watch.', 'Salute e sport si abbinano ad Apple Watch.'],
  'El iPhone es el hub de datos del Watch.': ['iPhone is the Watch’s data hub.', 'Das iPhone ist die Datenzentrale der Watch.', 'L’iPhone est le hub de données de la Watch.', 'L’iPhone è l’hub dati di Watch.'],
  'El iPhone es la base del día a día.': ['iPhone is the everyday foundation.', 'Das iPhone ist die Basis für den Alltag.', 'L’iPhone est la base du quotidien.', 'L’iPhone è la base di ogni giorno.'],
  'iPhone encaja como dispositivo móvil de trabajo.': ['iPhone fits as a mobile work device.', 'Das iPhone passt als mobiles Arbeitsgerät.', 'L’iPhone convient comme appareil mobile de travail.', 'L’iPhone è adatto come dispositivo mobile di lavoro.'],
  'AirPods es un complemento natural para trabajar con llamadas.': ['AirPods is a natural accessory for working with calls.', 'AirPods sind ein natürliches Zubehör für Arbeit mit Anrufen.', 'Les AirPods sont un accessoire naturel pour travailler avec des appels.', 'Gli AirPods sono un accessorio naturale per lavorare con le chiamate.'],
  'Programación y apps de escritorio son terreno de Mac.': ['Programming and desktop apps are Mac territory.', 'Programmieren und Desktop-Apps sind Mac-Terrain.', 'La programmation et les applis de bureau, c’est le terrain du Mac.', 'Programmazione e app desktop sono terreno del Mac.'],
  'La edición creativa exige Mac.': ['Creative editing calls for a Mac.', 'Kreative Bearbeitung verlangt einen Mac.', 'Le montage créatif exige un Mac.', 'Il montaggio creativo richiede un Mac.'],
  'iPad brilla para gestiones móviles.': ['iPad shines for tasks on the move.', 'Das iPad glänzt bei Erledigungen unterwegs.', 'L’iPad brille pour les démarches en mobilité.', 'L’iPad brilla per le attività in mobilità.'],
  'iPhone es imbatible para gestiones rápidas en movimiento.': ['iPhone is unbeatable for quick tasks on the go.', 'Das iPhone ist unschlagbar für schnelle Erledigungen unterwegs.', 'L’iPhone est imbattable pour les démarches rapides en déplacement.', 'L’iPhone è imbattibile per attività rapide in movimento.'],

  // ---- Motivos por respuesta ----
  'Encaja con el formato portátil que pediste.': ['It matches the laptop format you asked for.', 'Es passt zum Notebook-Format, das du wolltest.', 'Il correspond au format portable demandé.', 'Corrisponde al formato portatile che hai chiesto.'],
  'Encaja con el formato sobremesa que pediste.': ['It matches the desktop format you asked for.', 'Es passt zum Desktop-Format, das du wolltest.', 'Il correspond au format de bureau demandé.', 'Corrisponde al formato desktop che hai chiesto.'],
  'Compatible con Apple Pencil, como pediste.': ['Works with Apple Pencil, as you asked.', 'Mit Apple Pencil kompatibel, wie gewünscht.', 'Compatible avec l’Apple Pencil, comme demandé.', 'Compatibile con Apple Pencil, come hai chiesto.'],
  'Compatible con Magic Keyboard, como pediste.': ['Works with Magic Keyboard, as you asked.', 'Mit Magic Keyboard kompatibel, wie gewünscht.', 'Compatible avec le Magic Keyboard, comme demandé.', 'Compatibile con Magic Keyboard, come hai chiesto.'],
  'Incluye variante Cellular disponible.': ['A Cellular version is available.', 'Eine Cellular-Variante ist verfügbar.', 'Une version Cellular est disponible.', 'È disponibile una variante Cellular.'],
  'Cámara destacada, tu prioridad principal.': ['Standout camera — your main priority.', 'Herausragende Kamera — deine Hauptpriorität.', 'Appareil photo remarquable — votre priorité principale.', 'Fotocamera eccellente — la tua priorità principale.'],
  'Muy buena autonomía, tu prioridad principal.': ['Very good battery life — your main priority.', 'Sehr gute Laufzeit — deine Hauptpriorität.', 'Très bonne autonomie — votre priorité principale.', 'Ottima autonomia — la tua priorità principale.'],
  'Máxima potencia de la familia.': ['The most powerful in its family.', 'Die höchste Leistung der Familie.', 'La puissance maximale de la gamme.', 'La massima potenza della famiglia.'],
  'Muy portátil, como pediste.': ['Very portable, as you asked.', 'Sehr tragbar, wie gewünscht.', 'Très portable, comme demandé.', 'Molto portatile, come hai chiesto.'],
  'Excelente relación calidad-precio.': ['Excellent value for money.', 'Ausgezeichnetes Preis-Leistungs-Verhältnis.', 'Excellent rapport qualité-prix.', 'Ottimo rapporto qualità-prezzo.'],
  'Batería para deportes largos.': ['Battery life for long workouts.', 'Akku für lange Sporteinheiten.', 'Autonomie pour les sports longs.', 'Autonomia per sport prolungati.'],
  'Cancelación de ruido para viajes.': ['Noise cancellation for travelling.', 'Geräuschunterdrückung für Reisen.', 'Réduction de bruit pour les voyages.', 'Cancellazione del rumore per i viaggi.'],
  'Buena opción para estudio.': ['A good option for studying.', 'Eine gute Wahl fürs Studium.', 'Une bonne option pour les études.', 'Una buona opzione per lo studio.'],

  // ---- Compromisos ----
  'Tamaño distinto al que preferías.': ['A different size from the one you preferred.', 'Andere Größe als die von dir bevorzugte.', 'Taille différente de celle que vous préfériez.', 'Taglia diversa da quella che preferivi.'],
  'Requiere elegir explícitamente la variante Cellular al comprar.': ['You must explicitly choose the Cellular version when buying.', 'Beim Kauf muss die Cellular-Variante ausdrücklich gewählt werden.', 'Il faut choisir explicitement la version Cellular à l’achat.', 'Bisogna scegliere esplicitamente la variante Cellular all’acquisto.'],
  'No es compatible con Apple Pencil.': ['It is not compatible with Apple Pencil.', 'Nicht mit dem Apple Pencil kompatibel.', 'Il n’est pas compatible avec l’Apple Pencil.', 'Non è compatibile con Apple Pencil.'],
  'No es compatible con Magic Keyboard.': ['It is not compatible with Magic Keyboard.', 'Nicht mit dem Magic Keyboard kompatibel.', 'Il n’est pas compatible avec le Magic Keyboard.', 'Non è compatibile con Magic Keyboard.'],
  'No ofrece variante Cellular en el prototipo.': ['It has no Cellular version in the prototype.', 'Im Prototyp gibt es keine Cellular-Variante.', 'Il n’offre pas de version Cellular dans le prototype.', 'Non offre una variante Cellular nel prototipo.'],
  'Formato de ajuste distinto al indicado.': ['A different fit from the one you indicated.', 'Anderer Sitz als angegeben.', 'Format d’ajustement différent de celui indiqué.', 'Vestibilità diversa da quella indicata.'],
  'Formato: has pedido portátil.': ['Format: you asked for a laptop.', 'Format: Du wolltest ein Notebook.', 'Format : vous avez demandé un portable.', 'Formato: hai chiesto un portatile.'],

  // ---- Motivos con valores dentro ----
  // Llevan marcadores en vez del valor ya escrito: el importe se formatea con
  // el idioma activo, y en inglés el símbolo va delante de la cifra.
  'Ajuste {ajuste} coincide con tu preferencia.': ['{ajuste} fit matches your preference.', 'Der Sitz {ajuste} entspricht deiner Präferenz.', 'L’ajustement {ajuste} correspond à votre préférence.', 'La vestibilità {ajuste} corrisponde alla tua preferenza.'],
  'Tamaño {tamano} como preferiste.': ['{tamano} size, just as you preferred.', 'Größe {tamano}, wie von dir bevorzugt.', 'Taille {tamano}, comme vous le préfériez.', 'Taglia {tamano}, come preferivi.'],
  'Entra en tu presupuesto ({importe}).': ['Within your budget ({importe}).', 'Liegt in deinem Budget ({importe}).', 'Dans votre budget ({importe}).', 'Rientra nel tuo budget ({importe}).'],
  'Ligeramente por encima del presupuesto ({precio} vs {importe}).': ['Slightly over budget ({precio} vs {importe}).', 'Leicht über dem Budget ({precio} statt {importe}).', 'Légèrement au-dessus du budget ({precio} contre {importe}).', 'Leggermente sopra il budget ({precio} contro {importe}).'],
  'Por encima de tu referencia ({precio} vs {importe}).': ['Above your reference ({precio} vs {importe}).', 'Über deinem Richtwert ({precio} statt {importe}).', 'Au-dessus de votre référence ({precio} contre {importe}).', 'Sopra il tuo riferimento ({precio} contro {importe}).'],
  'Precio {precio} por encima del presupuesto ({importe}).': ['Price {precio} is over the budget ({importe}).', 'Preis {precio} liegt über dem Budget ({importe}).', 'Le prix {precio} dépasse le budget ({importe}).', 'Il prezzo {precio} supera il budget ({importe}).'],
  'Precio por encima incluso del margen del 15 % ({importe}).': ['Price is above even the 15% margin ({importe}).', 'Preis liegt selbst über der 15-%-Marge ({importe}).', 'Le prix dépasse même la marge de 15 % ({importe}).', 'Il prezzo supera anche il margine del 15% ({importe}).'],
  'Hasta {importe}': ['Up to {importe}', 'Bis {importe}', 'Jusqu’à {importe}', 'Fino a {importe}'],

  // ---- Valores de tamaño (se pintan dentro de un motivo) ----
  'grande': ['large', 'groß', 'grande', 'grande'],
  'compacto': ['compact', 'kompakt', 'compact', 'compatto'],
  'equilibrado': ['balanced', 'ausgewogen', 'équilibré', 'equilibrato'],

  // ---- Etiquetas de ajuste de AirPods ----
  'abierto': ['open', 'offen', 'ouvert', 'aperto'],
  'in-ear': ['in-ear', 'In-Ear', 'intra-auriculaire', 'in-ear'],
  'de diadema': ['over-ear', 'Over-Ear', 'circum-auriculaire', 'over-ear'],
}
