export const badPatterns = [
  "^(о|а)н(о|а)нист.*",
  "^лошар.*",
  "^к(а|о)злина$",
  "^к(о|а)зел$",
  "^сволоч(ь|ъ|и|уга|ам|ами).*",
  "^лох[уеыаоэяию].*",
  ".*урод(ы|у|ам|ина|ины).*",
  ".*бля(т|д).*", ".*гандо.*",
  "^м(а|о)нд(а|о).*",
  ".*сперма.*",
  ".*[уеыаоэяию]еб$",
  "^сучк(а|у|и|е|ой|ай).*",
  "^придур(ок|ки).*",
  "^д(е|и)би(л|лы).*",
  "^сос(ать|и|ешь|у)$",
  "^залуп.*",
  "^муд(е|ил|о|а|я|еб).*",
  ".*шалав(а|ы|ам|е|ами).*",
  ".*пр(а|о)ст(и|е)т(у|е)тк(а|и|ам|е|ами).*",
  ".*шлюх(а|и|ам|е|ами).*",
  ".*ху(й|и|ю|я|е|л(и|е)).*",
  ".*п(и|е|ы)зд.*",
  "^бл(я|т|д).*",
  "(с|сц)ук(а|о|и|у).*",
  "^(ё|е|й(о|е))(п|б).*",
  ".*(д(о|а)лб(о|а)|разъ|разь|за|вы|по)ебы*.*",
  ".*пид(а|о|е)р.*",
  ".*хер.*"
];

export const goodPatterns = [
  ".*психу.*",
  ".*к(о|а)манд.*",
  ".*истр(е|и)блять.*",
  ".*л(о|а)х(о|а)трон.*",
  ".*(о|а)ск(о|а)рблять.*",
  "хул(е|и)ган",
  ".*м(а|о)нд(а|о)рин.*",
  ".*р(а|о)ссл(а|о)блять.*",
  ".*п(о|а)тр(е|и)блять.*",
  ".*@.*\\.(ру|сом|нет)$",
  "манд(а|о)рин"
];

export const goodWords = [
  "дезмонда",
  "застрахуйте",
  "одномандатный",
  "подстрахуй",
  "психуй",
  "йоп"
];

export const letters = {
  "a": "а",
  "b": "в",
  "c": "с",
  "e": "е",
  "f": "ф",
  "g": "д",
  "h": "н",
  "i": "и",
  "k": "к",
  "l": "л",
  "m": "м",
  "n": "н",
  "o": "о",
  "p": "р",
  "r": "р",
  "s": "с",
  "t": "т",
  "u": "у",
  "v": "в",
  "x": "х",
  "y": "у",
  "w": "ш",
  "z": "з",
  "ё": "е",
  "6": "б",
  "9": "д"
};

export const containsMat = function (text = '') {
  text = cleanBadSymbols(text.toLowerCase());

  const words = text.split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const word = convertEngToRus(words[i]);

    if (isInGoodWords(word) && isInGoodPatterns(word)) continue;
    if (isInBadPatterns(word)) return true;
  }

  if (containsMatInSpaceWords(words)) return true;

  return false;
};

export const convertEngToRus = function (word) {
  for (let j = 0; j < word.length; j++) {
    for (const key in letters) {
      if (word.charAt(j) == key)
        word = word.substring(0, j) + letters[key] + word.substring(j + 1, word.length);
    }
  }

  return word;
};

export const cleanBadSymbols = function (text = '') {
  return text.replace(/[^a-zA-Zа-яА-Яё0-9\s]/g, "").replace(/(\D)\1+/, '$1');
};

export const isInGoodWords = function (word = '') {
  for (let i = 0; i < goodWords.length; i++) {
    if (word == goodWords[i]) return true;
  }

  return false;
};

export const isInGoodPatterns = function (word = '') {
  for (let i = 0; i < goodPatterns.length; i++) {
    const pattern = new RegExp(goodPatterns[i]);
    if (pattern.test(word)) return true;
  }

  return false;
};

export const isInBadPatterns = function (word = '') {
  for (let i = 0; i < badPatterns.length; i++) {
    const pattern = new RegExp(badPatterns[i]);
    if (pattern.test(word)) return true;
  }

  return false;
};

export const containsMatInSpaceWords = function (words: string[]) {
  const spaceWords = findSpaceWords(words);

  for (let i = 0; i < spaceWords.length; i++) {
    const word = convertEngToRus(spaceWords[i]);
    if (isInBadPatterns(word)) return true;
  }

  return false;
};

export const findSpaceWords = function (words: string[]) {
  const out = [];
  let spaceWord = "";

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    if (word.length <= 3) {
      spaceWord += word;
      continue;
    }

    if (spaceWord.length >= 3) {
      out.push(spaceWord);
      spaceWord = "";
    }
  }

  return out;
};

export const addBadPattern = function (pattern = '') {
  badPatterns.push(pattern);
};

export const addGoodPattern = function (pattern = '') {
  goodPatterns.push(pattern);
};

export const addGoodWord = function (pattern = '') {
  goodWords.push(pattern);
};