/**
 * Výchozí ukázková data pro lokální interaktivní režim (když není nakonfigurovaný Firebase).
 */
export const DEMO_STORAGE_KEY = 'dopis_jeziskovi_demo_v2';

export function createInitialDemoState() {
  const now = Date.now();
  return {
    activeUid: 'demo-jirka',
    users: {
      'demo-jirka': {
        uid: 'demo-jirka',
        displayName: 'Jirka',
        tag: '4821',
        avatarId: 'prasatko',
        avatarBg: '#F5EEDB',
        createdAt: now - 86400000 * 7,
      },
      'demo-dana': {
        uid: 'demo-dana',
        displayName: 'Dana',
        tag: '7392',
        avatarId: 'srnecek',
        avatarBg: '#F5EEDB',
        createdAt: now - 86400000 * 6,
      },
      'demo-marie': {
        uid: 'demo-marie',
        displayName: 'Babička Marie',
        tag: '1054',
        avatarId: 'sova',
        avatarBg: '#F5EEDB',
        createdAt: now - 86400000 * 5,
      },
      'demo-tomas': {
        uid: 'demo-tomas',
        displayName: 'Tomáš',
        tag: '5519',
        avatarId: 'liska',
        avatarBg: '#F5EEDB',
        createdAt: now - 86400000 * 4,
      },
    },
    letters: {
      'letter-jirka-main': {
        id: 'letter-jirka-main',
        ownerUid: 'demo-jirka',
        recipientName: 'Jirka',
        isChildLetter: false,
        introText:
          'letos bych si pod stromeček přál hlavně novou historickou knížku a teplé ponožky na hory. Přidal jsem na seznam dvě konkrétní věci.',
        outroText: 'Díky moc,\nJirka',
        printTheme: 'handwritten',
        createdAt: now - 3600000 * 12,
        updatedAt: now - 3600000 * 12,
        wishes: [
          {
            id: 'wish-j1',
            title: 'Kniha Toulky českou minulostí',
            url: 'https://www.databazeknih.cz',
            note: 'První díl v pevné vazbě',
            createdAt: now - 3600000 * 12,
          },
          {
            id: 'wish-j2',
            title: 'Vlněné teplé ponožky na hory',
            url: '',
            note: 'Velikost 43–44, tmavě zelená nebo šedá',
            createdAt: now - 3600000 * 10,
          },
        ],
      },
      'letter-dana-main': {
        id: 'letter-dana-main',
        ownerUid: 'demo-dana',
        recipientName: 'Dana',
        isChildLetter: false,
        introText:
          'napsala jsem sem pár drobností, které mi doma chybí. Hlavně ať si o svátcích v klidu odpočineme.',
        outroText: 'Dana',
        printTheme: 'fairytale',
        createdAt: now - 3600000 * 8,
        updatedAt: now - 3600000 * 8,
        wishes: [
          {
            id: 'wish-d1',
            title: 'Kameninový hrnek na čaj',
            url: 'https://www.fler.cz',
            note: 'Krémová nebo pastelově zelená glazura',
            createdAt: now - 3600000 * 8,
          },
          {
            id: 'wish-d2',
            title: 'Svíčka ze včelího vosku',
            url: '',
            note: 'Přírodní vůně medu nebo skořice',
            createdAt: now - 3600000 * 7,
          },
        ],
      },
      'letter-dana-julinka': {
        id: 'letter-dana-julinka',
        ownerUid: 'demo-dana',
        coParentUids: ['demo-jirka'],
        recipientName: 'Julinka',
        isChildLetter: true,
        introText:
          've školce jsem byla hodná a už umím sama jezdit na kole. Moc bych si přála hrad pro princezny a nové fixy na kreslení.',
        outroText: 'Ahoj, Julinka',
        printTheme: 'handwritten',
        createdAt: now - 3600000 * 5,
        updatedAt: now - 3600000 * 5,
        wishes: [
          {
            id: 'wish-jul1',
            title: 'Dřevěná stavebnice Hrad',
            url: 'https://www.agatinsvet.cz',
            note: 'S princeznou a koníkem',
            createdAt: now - 3600000 * 5,
          },
          {
            id: 'wish-jul2',
            title: 'Kreslící sada pastelkových fixů',
            url: '',
            note: 'Alespoň 24 barev v kufříku',
            createdAt: now - 3600000 * 4,
          },
        ],
      },
      'letter-dana-sarinka': {
        id: 'letter-dana-sarinka',
        ownerUid: 'demo-dana',
        recipientName: 'Šárinka',
        isChildLetter: true,
        introText:
          'píšu za Šárinku, protože je ještě malá. Největší radost jí teď udělá měkký plyšák do postýlky.',
        outroText: 'Šárinka (napsala máma)',
        printTheme: 'minimal',
        createdAt: now - 3600000 * 3,
        updatedAt: now - 3600000 * 3,
        wishes: [
          {
            id: 'wish-sar1',
            title: 'Plyšový medvídek v šále',
            url: '',
            note: 'Měkký na spaní do postýlky',
            createdAt: now - 3600000 * 3,
          },
        ],
      },
      'letter-marie-main': {
        id: 'letter-marie-main',
        ownerUid: 'demo-marie',
        recipientName: 'Babička Marie',
        isChildLetter: false,
        introText:
          'nic velkého prosím nekupujte, všechno důležité doma mám. Kdybyste ale chtěli pořídit nějakou maličkost, napsala jsem si sem křížovky a čaj.',
        outroText: 'Babička Marie',
        printTheme: 'fairytale',
        createdAt: now - 3600000 * 2,
        updatedAt: now - 3600000 * 2,
        wishes: [
          {
            id: 'wish-m1',
            title: 'Křížovky a luštění na zimu',
            url: '',
            note: 'S většími písmeny',
            createdAt: now - 3600000 * 2,
          },
          {
            id: 'wish-m2',
            title: 'Bylinkový vánoční čaj v plechovce',
            url: 'https://www.sonnentor.com/cs-cz',
            note: 'Bez kofeinu',
            createdAt: now - 3600000 * 1,
          },
        ],
      },
      'letter-tomas-main': {
        id: 'letter-tomas-main',
        ownerUid: 'demo-tomas',
        recipientName: 'Tomáš',
        isChildLetter: false,
        introText:
          'na náš předvánoční sraz s partou jsem sepsal pár tipů pro inspiraci.',
        outroText: 'Tomáš',
        printTheme: 'minimal',
        createdAt: now - 3600000 * 1,
        updatedAt: now - 3600000 * 1,
        wishes: [
          {
            id: 'wish-t1',
            title: 'Zrnková výběrová káva na filtr',
            url: '',
            note: 'Střední pražení, Etiopie nebo Kolumbie',
            createdAt: now - 3600000 * 1,
          },
          {
            id: 'wish-t2',
            title: 'Karetní hra Krycí jména',
            url: '',
            note: 'Klasická verze na silvestrovskou chatu',
            createdAt: now - 1800000,
          },
        ],
      },
    },
    claims: {
      'letter-dana-julinka_wish-jul2': {
        id: 'letter-dana-julinka_wish-jul2',
        letterId: 'letter-dana-julinka',
        letterOwnerUid: 'demo-dana',
        letterCoParentUids: ['demo-jirka'],
        wishId: 'wish-jul2',
        wishTitleSnapshot: 'Kreslící sada pastelkových fixů',
        wishUrlSnapshot: '',
        wishNoteSnapshot: 'Alespoň 24 barev v kufříku',
        recipientNameSnapshot: 'Julinka',
        claimedByUid: 'demo-marie',
        isBought: false,
        orphanStatus: 'active',
        createdAt: now - 3600000,
      },
    },
    connections: {
      'demo-dana_demo-jirka': {
        id: 'demo-dana_demo-jirka',
        users: ['demo-dana', 'demo-jirka'],
        status: 'accepted',
        requestedBy: 'demo-jirka',
        createdAt: now - 86400000 * 3,
      },
      'demo-jirka_demo-marie': {
        id: 'demo-jirka_demo-marie',
        users: ['demo-jirka', 'demo-marie'],
        status: 'accepted',
        requestedBy: 'demo-marie',
        createdAt: now - 86400000 * 2,
      },
      'demo-jirka_demo-tomas': {
        id: 'demo-jirka_demo-tomas',
        users: ['demo-jirka', 'demo-tomas'],
        status: 'accepted',
        requestedBy: 'demo-jirka',
        createdAt: now - 86400000 * 1,
      },
    },
    groups: {
      'group-rodina': {
        id: 'group-rodina',
        name: 'Naše rodina',
        icon: 'home',
        inviteCode: 'SKUPINA-1024',
        showChildLetters: true,
        createdBy: 'demo-jirka',
        memberUids: ['demo-jirka', 'demo-dana', 'demo-marie'],
        createdAt: now - 86400000 * 2,
      },
      'group-kamaradi': {
        id: 'group-kamaradi',
        name: 'Kamarádi',
        icon: 'friends',
        inviteCode: 'SKUPINA-8412',
        showChildLetters: false,
        createdBy: 'demo-jirka',
        memberUids: ['demo-jirka', 'demo-tomas'],
        createdAt: now - 86400000,
      },
    },
    privateIdeas: {
      'idea-1': {
        id: 'idea-1',
        ownerUid: 'demo-jirka',
        targetUid: 'demo-dana',
        targetName: 'Dana',
        title: 'Čokoládové pralinky',
        url: '',
        note: 'Z místní cukrárny',
        isBought: true,
        createdAt: now - 7200000,
      },
    },
  };
}
