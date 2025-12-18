export const fr = {
  common: {
    back: 'Retour',
    continue: 'Continuer',
    generate: 'Générer mon estimation',
    analyzing: 'Analyse…',
    downloadPdf: 'Télécharger le PDF',
    newQuote: 'Nouveau devis',
    generating: 'Génération…',
    selected: 'Sélectionné',
    optional: 'Optionnel',
    none: 'Aucun',
    notProvided: 'Non renseigné',
    notSpecified: 'Non spécifié',
    toBeMeasured: 'À mesurer',
    months: 'mois',
    footer: '2024 Spraystone — Transformation de façade',
    resumeGame: 'Jouer au mini-jeu',
  },
  imageModal: {
    close: 'Fermer',
    zoomIn: 'Zoom avant',
    zoomOut: 'Zoom arrière',
    rotate: 'Pivoter',
    reset: 'Réinitialiser',
    download: 'Télécharger',
    hintDrag: 'Faites glisser pour déplacer',
    hintZoom: 'Zoomez pour déplacer',
    hintClose: 'Cliquez en dehors ou appuyez sur ÉCHAP pour fermer',
  },
  stepIndicator: {
    step: 'Étape {current} / {total}',
    start: 'Début',
    finish: 'Fin',
  },
  steps: {
    address: {
      name: 'Adresse',
      title: 'Où se situe votre bâtiment ?',
      subtitle: 'Pour des mesures précises et la préparation du chantier',
      placeholder: 'Commencez à saisir votre adresse…',
      street: 'Rue',
      number: 'Numéro',
      postalCode: 'Code postal',
      city: 'Ville',
      mapsKeyMissing: 'Clé API Google Maps requise',
      moreSuggestionsHint: 'Continuez à saisir pour plus de résultats.',
    },
    facadeType: {
      name: 'Type de façade',
      title: 'Quel type de façade avez-vous ?',
      subtitle:
        'Sélectionnez le matériau qui correspond le mieux à votre extérieur.',
      options: {
        brick: {
          label: 'Brique / maçonnerie',
          description: 'Joints visibles, relief texturé, tons chauds.',
        },
        render: {
          label: 'Enduit / crépi',
          description: 'Enduit minéral lisse sur couche isolante.',
        },
        concrete: {
          label: 'Bloc béton',
          description: 'Blocs ou panneaux préfabriqués avec joints.',
        },
        painted: {
          label: 'Façade peinte',
          description: 'Façade peinte avec couche uniforme.',
        },
        other: {
          label: 'Autre / mixte',
          description: 'Pierre, bois ou combinaison de matériaux.',
        },
      },
    },
    condition: {
      name: 'État',
      title: 'Quel est l’état actuel de votre façade ?',
      subtitle:
        'Cela nous aide à identifier d’éventuelles réparations ou traitements nécessaires',
      options: {
        cracks: 'Fissures visibles ou peinture qui s’écaille',
        moss: 'Présence de mousse, humidité ou taches',
        good: 'Semble en bon état',
        unknown: 'Je ne sais pas',
      },
    },
    surface: {
      name: 'Surface',
      title: 'Quelle est la surface à traiter ?',
      subtitle:
        'Cela nous aide à affiner le devis — plus c’est précis, plus le plan Spraystone est clair.',
      tabs: {
        exact: 'Valeur exacte',
        estimate: 'Estimation',
        unknown: 'Je ne sais pas',
      },
      exact: {
        label: 'Indiquez la surface en m²',
        placeholder: 'ex. 96',
      },
      estimate: {
        options: {
          lt50: 'Moins de 50 m²',
          '50to100': '50 – 100 m²',
          '100to150': '100 – 150 m²',
          gt150: 'Plus de 150 m²',
        },
      },
      unknown: {
        title: 'Pas de souci !',
        body: 'Téléchargez une photo claire de la façade et notre équipe estimera la surface lors de la visite sur site.',
      },
      tips: {
        quickTitle: 'Astuce rapide',
        quickBody:
          'Mesurez largeur × hauteur pour chaque section, soustrayez les ouvertures, puis additionnez.',
        helpTitle: 'Besoin d’aide ?',
        helpBody:
          'Choisissez « Je ne sais pas » et nous apporterons des outils de mesure laser lors de la visite sur site.',
      },
    },
    finish: {
      name: 'Finition',
      title: 'Quelles finitions souhaitez-vous previsualiser ?',
      preview: {
        title: 'Apercus a generer',
        subtitle: 'Selectionnez une ou plusieurs finitions pour la page de resultats.',
        count: '{count} / {total} selectionne(s)',
        hint: 'Le bouton \"Generer les finitions selectionnees\" suivra cette selection.',
        note: 'Le bouton \"Generer les finitions selectionnees\" suivra cette selection.',
      },
      subtitle:
        'Choisissez la finition qui correspond le mieux à votre résultat idéal. Chaque option utilise la même texture pour le rendu.',
      sampleAlt: 'Échantillon de texture : {title}',
      options: {
        'natural-stone': {
          title: 'Aspect pierre naturelle (Spraystone)',
          subtitle:
            'Blocs inspirés de la pierre bleue avec mortier gris clair.',
          bestFor: 'Façades de caractère & maisons de ville',
        },
        smooth: {
          title: 'Enduit lisse ou micro-texturé',
          subtitle: 'Enduit minéral moderne aux transitions nettes.',
          bestFor: 'Constructions contemporaines & extensions',
        },
        textured: {
          title: 'Relief Spraystone texturé',
          subtitle: 'Enduit minéral travaillé avec agrégats visibles.',
          bestFor: 'Grandes surfaces nécessitant du relief',
        },
        other: {
          title: 'Mélange sur mesure / concept hybride',
          subtitle: 'Combinez Spraystone avec bois, métal ou brique.',
          bestFor: 'Projets multi-matériaux',
        },
        suggest: {
          title: 'Je ne suis pas sûr (suggestion atelier)',
          subtitle: 'Laissez notre atelier vous proposer 3 moodboards.',
          bestFor: 'Réponse rapide avec l’aide d’un expert',
        },
      },
    },
    photo: {
      name: 'Photo',
      title: 'Téléchargez une photo de votre façade actuelle',
      subtitle: 'Pour générer une visualisation avant/après',
      cta: 'Cliquez pour importer une photo',
      formats: 'JPG, PNG, HEIC (max 10 Mo)',
      previewAlt: 'Aperçu',
      remove: 'Supprimer la photo',
    },
    treatments: {
      name: 'Traitements',
      title: 'Souhaitez-vous ajouter un traitement complémentaire ?',
      subtitle:
        'Sélectionnez un ou plusieurs traitements pour renforcer la protection',
      options: {
        'water-repellent': {
          title: 'Protection hydrofuge',
          subtitle: 'Traitement anti-humidité pour une protection durable',
        },
        'anti-stain': {
          title: 'Traitement anti-taches / anti-pollution',
          subtitle: 'Aide à garder la façade propre et protégée',
        },
        none: {
          title: 'Non / pas nécessaire',
          subtitle: 'Sans traitement supplémentaire',
        },
        unknown: {
          title: 'Je ne sais pas encore',
          subtitle: 'Recevez les conseils d’un expert',
        },
      },
    },
    timeline: {
      name: 'Délai',
      title: 'Quel est votre délai souhaité pour les travaux ?',
      subtitle: 'Cela nous aide à planifier votre projet efficacement',
      options: {
        asap: 'Dès que possible',
        '1-3months': 'Dans 1 à 3 mois',
        '>3months': 'Dans plus de 3 mois',
        tbd: 'À déterminer',
      },
    },
    contact: {
      name: 'Contact',
      title: 'Comment pouvons-nous vous contacter ?',
      subtitle:
        'Indiquez au moins un moyen de contact afin que nous puissions vous joindre.',
      fields: {
        name: { placeholder: 'Nom complet' },
        email: { placeholder: 'Adresse e-mail' },
        phonePrefix: { ariaLabel: 'Indicatif' },
        phone: { placeholder: 'Numéro de téléphone' },
      },
      callDuringDay: {
        title: 'Souhaitez-vous que nous vous appelions en journée ?',
        help: 'Optionnel — nous vous appellerons sur le numéro ci-dessus.',
      },
      privacy: {
        title: 'Avis de confidentialité :',
        body: 'Vos informations seront uniquement utilisées pour vous fournir un devis personnalisé et ne seront pas partagées avec des tiers.',
      },
    },
  },
  results: {
    title: 'Votre aperçu Spraystone',
    subtitle: 'Visualisation avant/après haute fidélité avec estimation instantanée.',
    tabs: {
      preview: 'Aperçu',
      investment: 'Investissement',
      contact: 'Contact',
    },
    preview: {
      title: 'Aperçu',
      afterDisabled: 'Aperçu en cours de génération',
      open: 'Ouvrir',
      generation: {
        title: 'Generer vos apercus',
        generatingTitle: 'Generation de vos apercus',
        body: 'Generez un apercu (rapide) ou les finitions selectionnees pour comparer.',
        ctaOne: 'Generer la selection ({finish})',
        etaOne: 'Environ {seconds}s',
        ctaAll: 'Generer les finitions selectionnees ({count})',
        etaAll: 'Environ {seconds}s au total',
        note: 'Chaque finition ne peut etre generee qu\'une fois par session.',
      },
    },
    summaryTitle: 'Résumé',
    pdfError: 'Erreur lors de la génération du PDF. Veuillez réessayer.',
    beforeBadge: 'AVANT',
    afterBadge: 'APRÈS SPRAYSTONE',
    beforeImageAlt: 'Façade actuelle',
    afterImageAlt: 'Façade transformée',
    beforeCardTitle: 'État actuel',
    afterCardTitle: 'Après Spraystone',
    awaitingPhotoTitle: 'Photo de façade en attente',
    awaitingPhotoBody:
      'Téléchargez une photo claire afin que nous puissions appliquer la finition Spraystone avec précision.',
    previewSoonTitle: 'Aperçu bientôt disponible',
    previewSoonBody: 'avec la texture sélectionnée',
    afterSummaryFallback: 'Finition Spraystone appliquée avec la texture sélectionnée',
    details: {
      address: 'Adresse',
      type: 'Type',
      surface: 'Surface',
      finish: 'Finition',
      treatments: 'Traitements',
    },
    imageModal: {
      beforeTitle: 'Façade actuelle',
      beforeDescription: 'Votre façade avant traitement Spraystone',
      afterTitle: 'Façade transformée',
      afterDescription: 'Votre façade avec finition {finish}',
    },
    next: {
      title: 'Que se passe-t-il ensuite ?',
      step1: {
        title: 'Un représentant commercial vous contactera',
        body: 'Nous examinerons votre demande et vous contacterons pour confirmer les détails.',
      },
      step2: {
        title: 'Signature de l’offre',
        body: 'Une fois tout validé, nous vous enverrons l’offre pour signature.',
      },
      step3: {
        title: 'Début des travaux après confirmation de commande',
        body: 'Les travaux commencent dès que nous avons une confirmation de commande.',
      },
    },
    investment: {
      title: 'Investissement estimé',
      subtitle: 'Choisissez total fixe ou financement.',
      toggleTotal: 'Total fixe',
      toggleFinancing: 'Financement',
      totalCaption: 'Montant total fixe à financer',
      perMonth: '/ mois',
      financedAmount: 'Montant financé :',
      duration: 'Durée :',
      rate: 'Taux (TAEG/JKP) :',
      calcRate: 'Taux calcul :',
      durationLabel: 'Durée (mois)',
      legalMaxSummary:
        'Veuillez prêter attention à ces durées maximales légalement contraignantes',
      legalMax: {
        amount: 'Montant financé',
        duration: 'Durée maximale',
        over: '>',
      },
      disclaimer: '* Devis final sous réserve d’une visite sur site',
    },
    texture: {
      previewTitle: 'Finitions generees',
      previewAction: 'Voir cet echantillon',
      previewHelp: 'Generez les finitions selectionnees pour debloquer la comparaison, puis choisissez une finition pour voir l\'apercu.',
      locked: 'Generez les finitions selectionnees pour debloquer',
      title: 'Choisir une autre texture',
      generateTitle: 'Générer cette texture',
      optionAlt: 'Échantillon de texture : {label}',
      help: 'Choisissez une texture pour régénérer l’aperçu après.',
      options: {
        'natural-stone': 'Pierre naturelle',
        smooth: 'Lisse',
        textured: 'Texturé',
        other: 'Brique / hybride',
        suggest: 'Suggestion',
      },
    },
    contact: {
      title: 'Nous vous contacterons via :',
      call: {
        noPhone: 'Ajoutez un numéro de téléphone pour demander un appel.',
        requested: 'Rappel demandé.',
        optional: 'Optionnel — demander un rappel en journée.',
      },
    },
  },
  pdf: {
    header: {
      title: 'Devis façade Spraystone',
      subtitle: 'Généré automatiquement depuis votre session simulateur',
      date: 'Date : {date}',
    },
    table: {
      item: 'Élément',
      details: 'Détails',
    },
    fields: {
      client: 'Client',
      email: 'E-mail',
      phone: 'Téléphone',
      callback: 'Rappel en journée',
      address: 'Adresse',
      facadeType: 'Type de façade',
      condition: 'État',
      surfaceArea: 'Surface',
      desiredFinish: 'Finition souhaitée',
      treatments: 'Traitements',
      timeline: 'Délai',
    },
    callback: {
      requested: 'Demandé',
      notRequested: 'Non demandé',
    },
    visualization: {
      title: 'Visualisation',
      before: 'Avant',
      after: 'Après',
    },
    investment: {
      title: 'Investissement estimé',
      financingExample:
        'Exemple de financement : {months} mois — {installment} / mois (TAEG {taeg} %, taux calcul {calcRate} %, max {maxMonths} mois)',
      disclaimer: '*Sous réserve de mesures sur site & préparation',
    },
    footer: {
      note: 'Cette estimation est générée automatiquement. Le prix final peut varier après inspection sur site.',
      contact: 'Contact : contact@spraystone.eu  |  www.spraystone.eu',
    },
  },
  errors: {
    uploadTooLarge:
      'La photo est trop volumineuse. Veuillez importer une image de moins de 10 Mo.',
    uploadInvalidType:
      'Type de fichier non pris en charge. Veuillez importer un JPG, PNG ou HEIC.',
    uploadProcessFailed:
      'Impossible de traiter cette photo. Essayez un JPG/PNG, ou exportez votre image HEIC en JPEG puis réessayez.',
    azureImageNotConfigured:
      'La génération d’images Azure OpenAI n’est pas configurée.',
    openaiKeyMissing: 'Clé API OpenAI manquante.',
    openaiOrgVerification:
      'OpenAI requiert la vérification de l’organisation pour utiliser gpt-image-1.5. Veuillez vérifier votre org sur https://platform.openai.com/settings/organization/general.',
    imageGenerationFailed:
      'Échec de la génération d’image. Veuillez réessayer plus tard.',
    missingFacadeImage: 'Veuillez importer une photo de la façade',
    invalidAddress: 'Veuillez saisir une adresse valide',
    invalidPhoneForCall:
      'Veuillez saisir un numéro de téléphone valide pour demander un appel',
    provideContactMethod: 'Veuillez fournir une adresse e-mail ou un numéro de téléphone',
    invalidEmail: 'Veuillez saisir une adresse e-mail valide',
    invalidPhone: 'Veuillez saisir un numéro de téléphone valide',
    generateFailed: 'Échec de la génération : {message}',
    step: {
      address: 'Veuillez saisir votre adresse',
      facadeType: 'Veuillez sélectionner votre type de façade',
      condition: 'Veuillez sélectionner l’état de votre façade',
      surface: 'Veuillez sélectionner la surface à traiter',
      finish: 'Veuillez sélectionner une finition',
      photo: 'Veuillez importer une photo de la façade',
      timeline: 'Veuillez sélectionner un délai souhaité',
      phoneForCall:
        'Veuillez saisir un numéro de téléphone valide pour demander un appel',
      emailOrPhone:
        'Veuillez fournir une adresse e-mail valide ou un numéro de téléphone',
      complete: 'Veuillez compléter cette étape',
    },
  },
  progress: {
    preparingImage: 'Préparation de l’image…',
    generatingMock: 'Génération d’une analyse de démonstration…',
    complete: 'Terminé !',
    chatNotConfigured: 'Chat non configuré, estimation rapide…',
    chatKeyMissing: 'Clé chat manquante, estimation rapide…',
    analyzingFacadeData: 'Analyse des données de façade…',
    analyzingFacade: 'Analyse de la façade…',
    analyzingRetry: 'Analyse de la façade… nouvel essai {attempt}/{total}',
    creatingVisualization: 'Création de la visualisation de finition…',
    image: {
      lockingReference: 'Verrouillage de la référence Spraystone…',
      assemblingBrief: 'Assemblage du brief de rénovation…',
      sendingReferences: 'Envoi des références au moteur Spraystone…',
      refiningLayersRetry: 'Affinage des couches… nouvel essai {attempt}/{total}',
      calibratingFinishRetry: 'Calibrage de la finition… nouvel essai {attempt}/{total}',
      craftingTextureRetry: 'Création de la texture Spraystone… nouvel essai {attempt}/{total}',
      artisansRetry: 'Polissage par les artisans IA… nouvel essai {attempt}/{total}',
      geminiRetry: 'Le studio Gemini itère… nouvel essai {attempt}/{total}',
    },
  },
  gameModal: {
    contentLabel: 'Hyperflux Defender',
    title: 'File de rendu Spraystone',
    subtitle: 'Rendu en arrière-plan pendant que vous jouez une partie d’Hyperflux.',
    close: 'Fermer',
    closeAria: 'Fermer le mini-jeu',
    info: 'Hyperflux Defender occupe l’équipe pendant que le rendu Spraystone se termine.',
    ready: 'Façade prête !',
    status: {
      ready: 'Rendu prêt — affichage de votre façade',
      rendering: 'Rendu en cours… {percent}%',
      preparing: 'Préparation de l’aperçu HD…',
    },
  },
} as const;
