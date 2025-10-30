// ソート-------------------------------------------------------------------------
export const typeOrder = ['Artist', 'Song', 'Magic', 'Direction'];
export const colorOrder = ['赤', '青', '黄', '白', '黒', 'ALL'];
export const collectionList = [
    "スターターデッキ花譜",
    "スターターデッキ理芽",
    "スターターデッキ春猿火",
    "スターターデッキヰ世界情緒",
    "スターターデッキ幸祜",
    "ブースターパックvol.1「開演の魔女」",
    "KAMITSUBAKI COLLECTION EXTRA PACK",
    "ブースターパックvol.2「結束の連歌」",
    "御伽噺EXTRA PACK",
    "スターターデッキ花譜・明透",
    "スターターデッキ理芽・CIEL",
    "ブースターパックvol.3「再生の花達」",
    "IBA EXTRA PACK",
    "KAMITSUBAKI ARTWORK EXTRA PACK",
    "ブースターパックvol.4「魔女の黒鳴」",
    "MEMORIES PACK「追奏」",
    "プロモパックvol.1",
    "プロモパックvol.2",
    "エクストラ"
];

// ナチュラルソート（例： 'A-1', 'A-10', 'A-2' を人間の期待通りに並べる）
export const naturalCompare = (a, b) => {
    const ax = [];
    const bx = [];

    a.replace(/(\d+)|(\D+)/g, (_, $1, $2) => ax.push([$1 || Infinity, $2 || ""]));
    b.replace(/(\d+)|(\D+)/g, (_, $1, $2) => bx.push([$1 || Infinity, $2 || ""]));

    while (ax.length && bx.length) {
        const an = ax.shift();
        const bn = bx.shift();
        const nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
        if (nn) return nn;
    }

    return ax.length - bx.length;
};

// 色の頭文字を抽出（例："赤み" → "赤"、該当なしの場合 "ALL"）
export const extractPrimaryColor = (color) => {
    if (!color) return 'ALL';
    for (const baseColor of colorOrder) {
        if (color.startsWith(baseColor)) return baseColor;
    }
    return 'ALL';
};

// カードの色情報に複数色が含まれているかチェック
export const isMultiColor = (color) => {
    if (!color) return false;
    let count = 0;
    for (const baseColor of colorOrder) {
        if (color.includes(baseColor)) count++;
    }
    return count > 1;
};

// デッキのカードを並び替える関数
export const sortDeck = (deckArray) => {
    return [...deckArray].sort((a, b) => {
        const aTypeIndex = typeOrder.indexOf(a.type);
        const bTypeIndex = typeOrder.indexOf(b.type);
        if (aTypeIndex !== bTypeIndex) return aTypeIndex - bTypeIndex;

        // Magicカードのkind（即時／装備）でソート
        if (a.type === 'Magic' && b.type === 'Magic') {
            const kindOrder = ['即時', '装備']; // 順番指定
            const aKindIndex = kindOrder.indexOf(a.kind);
            const bKindIndex = kindOrder.indexOf(b.kind);
            if (aKindIndex !== bKindIndex) return aKindIndex - bKindIndex;
        }

        const aPrimary = extractPrimaryColor(a.color);
        const bPrimary = extractPrimaryColor(b.color);
        const aColorIndex = colorOrder.indexOf(aPrimary);
        const bColorIndex = colorOrder.indexOf(bPrimary);
        if (aColorIndex !== bColorIndex) return aColorIndex - bColorIndex;

        if (a.type === 'Song' && b.type === 'Song') {
            const aIsMulti = isMultiColor(a.color);
            const bIsMulti = isMultiColor(b.color);
            if (aIsMulti !== bIsMulti) {
                return aIsMulti ? 1 : -1;
            }
        }

        return naturalCompare(a.id, b.id);
    });
};

// 暗号化、複合化------------------------------------------------------------------
const CodetoNumber = { ex: "0", A: "1", B: "2", C: "3", D: "4", E: "5", F: "6", G: "7", H: "8", I: "9", prm: "10", J: "11", K: "12", L: "13", M: "14", N: "15", O: "16", P: "17", Q: "18", R: "19" };
const CodetoNumber_alter = Object.fromEntries(Object.entries(CodetoNumber).map(([k, v]) => [v, k]));
const ElementtoNumber = { A: "1", S: "2", M: "3", D: "4" };
const ElementtoNumber_alter = Object.fromEntries(Object.entries(ElementtoNumber).map(([k, v]) => [v, k]));
const NumbertoNumber = {}; const NumbertoNumber_alter = {};
for (let i = 1; i <= 9; i++) {
    NumbertoNumber[i.toString()] = "0" + i;
    NumbertoNumber_alter["0" + i] = i.toString();
}
const numberToLetter = [
    ['A','I','Q','Y','g','o','w','5'], ['B','J','R','Z','h','p','x','6'],
    ['C','K','S','a','i','q','y','7'], ['D','L','T','b','j','r','z','8'],
    ['E','M','U','c','k','s','1','9'], ['F','N','V','d','l','t','2','!'],
    ['G','O','W','e','m','u','3','?'], ['H','P','X','f','n','v','4','/']
];
const letterToNumber_x = {}, letterToNumber_y = {};
for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    letterToNumber_x[numberToLetter[i][j]] = j;
    letterToNumber_y[numberToLetter[i][j]] = i;
}

export function encryptDeck(deckList) {
    const DeckData = {};
    deckList.forEach(card => { DeckData[card] = (DeckData[card] || 0) + 1; });
    let text = "";
    for (const [key, count] of Object.entries(DeckData)) {
        const [part1, part2] = key.split("-");
        const key2 = part1.slice(0, -1); const key3 = part1.slice(-1);
        let t = "", flag = false;
        if (CodetoNumber[key2]) {
            if (parseInt(CodetoNumber[key2]) >= 10) { flag = true; t += (parseInt(CodetoNumber[key2]) - 10).toString(); }
            else t += CodetoNumber[key2];
        }
        if (ElementtoNumber[key3]) t += ElementtoNumber[key3];
        t += NumbertoNumber[part2] || part2;
        t += (flag ? count + 5 : count);
        text += t;
    }
    let nums = [];
    for (let i = 0; i < text.length; i += 3) nums.push(parseInt(text.substr(i, 3)));
    nums = nums.map(n => 500 - n);
    let bin = nums.map(n => {
        let b = (n < 0 ? (1024 + n) : n).toString(2).padStart(10, '0');
        return b;
    }).join("");
    let padding = 0;
    while (bin.length % 6 !== 0) { bin += "0"; padding++; }
    let bits = bin.match(/.{1,3}/g);
    let values = bits.map(b => parseInt(b, 2));
    let text2 = "";
    for (let i = 0; i < values.length; i += 2)
        text2 += numberToLetter[values[i]][values[i + 1]];
    let zeroPadding = 7 - padding;
    let zeroBits = 7 - (bits.filter(v => v === "000").length % 8);
    const result = "KCG-" + numberToLetter[zeroPadding][zeroBits] + text2;
    return result;
}

export function decryptCode(codeData) {
    let text = codeData.split('-')[1];
    const head = text[0];
    const drop = 7 - letterToNumber_y[head];
    text = text.slice(1);
    let bin = "";
    for (let c of text) {
        bin += letterToNumber_y[c].toString(2).padStart(3, '0');
        bin += letterToNumber_x[c].toString(2).padStart(3, '0');
    }
    bin = bin.slice(0, bin.length - drop);
    let nums = [];
    for (let i = 0; i < bin.length; i += 10) {
        const bits = bin.substr(i, 10);
        let value;
        if (bits[0] === '0') {
            value = parseInt(bits, 2);
        } else {
            value = parseInt(bits, 2) - 1024;
        }
        nums.push(500 - value);
    }

    let str = "";
    let totalLength = 0;
    for (let i = 0; i < nums.length - 1; i++) {
        str += nums[i].toString().padStart(3, '0');
        totalLength += 3;
    }
    let last = nums[nums.length - 1].toString();
    let pad = 5 - (totalLength + last.length) % 5;
    if (pad === 1) str += "0" + last;
    else if (pad === 2) str += "00" + last;
    else str += last;

    let output = "";
    for (let i = 0; i < str.length; i += 5) {
        const seg = str.substr(i, 5);
        let rawCount = parseInt(seg[4]);
        let code = seg[0], attr = seg[1], num = seg.substr(2, 2);
        let codeInt = parseInt(code);
        let count;

        if (codeInt === 0 && rawCount >= 6) {
            count = rawCount - 5;  // prm
        } else if (codeInt !== 0 && rawCount >= 6) {
            count = rawCount - 5;  // J 以降
        } else {
            count = rawCount;
        }

        let realCode;
        if (codeInt === 0 && rawCount >= 6) {
            realCode = CodetoNumber_alter["10"]; // prm
        } else if (codeInt === 0) {
            realCode = CodetoNumber_alter["0"];  // ex
        } else if (rawCount >= 6) {
            realCode = CodetoNumber_alter[(codeInt + 10).toString()];
        } else {
            realCode = CodetoNumber_alter[codeInt.toString()];
        }
        let realAttr = ElementtoNumber_alter[attr];
        let realNum = NumbertoNumber_alter[num] || num;

        for (let j = 0; j < count; j++) {
            output += `${realCode}${realAttr}-${realNum}`;
            if (!(i + 5 === str.length && j === count - 1)) output += "/";
        }
    }
    return output;
}

// サイド込み暗号------------------------------------------------------------------
export const encryptDeckPair = (mainDeck, sideDeck = []) => {
    const mainIds = mainDeck.map((card) => card.id);
    const mainCode = encryptDeck(mainIds);
    
    if (sideDeck.length > 0) {
        const sideIds = sideDeck.map((card) => card.id);
        const sideCode = encryptDeck(sideIds);
        return `${mainCode}_${sideCode}`;
    }
    return mainCode;
};

// 起動時読み込み------------------------------------------------------------------
export function decodeDeckFromParam(deckParam, setDeck, setSideDeck = null) {
    if (deckParam) {
        const isBase64 = deckParam.startsWith('W') || deckParam.startsWith('J') || deckParam.startsWith('e');
        if (isBase64) {
            try {
                const json = atob(deckParam);
                const ids = JSON.parse(json);
                fetch("/cards.json")
                    .then((res) => res.json())
                    .then((allCards) => {
                        const restoredDeck = ids
                            .map((id) => allCards.find((card) => card.id === id))
                            .filter((card) => card && card.name !== null);
                        setDeck(sortDeck(restoredDeck));
                    });
            } catch (e) {
                console.error('Base64形式のデッキ復元に失敗', e);
            }
        } else if (deckParam.startsWith("KCG-")) {
            const parts = deckParam.split("_");
            const mainCode = parts[0];
            const sideCode = parts[1];

            fetch("/cards.json")
                .then((res) => res.json())
                .then((allCards) => {
                    const mainIds = decryptCode(mainCode).split("/");
                    const mainDeck = mainIds
                        .map((id) => allCards.find((card) => card.id === id))
                        .filter((card) => card && card.name !== null);
                    setDeck(sortDeck(mainDeck));

                    if (sideCode && setSideDeck) {
                        const sideIds = decryptCode(sideCode).split("/");
                        const sideDeck = sideIds
                            .map((id) => allCards.find((card) => card.id === id))
                            .filter((card) => card && card.name !== null);
                        setSideDeck(sortDeck(sideDeck));
                    }
                });
        }
    }
}

// URL読込------------------------------------------------------------------------
export const importDeckFromURL = (importURL, setDeck, setSideDeck) => {
  try {
    // まずは URL をパース（相対・ハッシュのみでも動くように location.origin を補完）
    let url;
    try {
      url = new URL(importURL, window?.location?.origin || 'https://example.com');
    } catch {
      // ここに来ることは稀ですが、万一に備え fallback
      alert('無効なURLです');
      return;
    }

    // 1) 通常の ? で始まるクエリ
    // 2) ハッシュ(#/new-deck-view/...) 内の ? 以降にあるクエリ
    let queryString = url.search; // 例: "?deck=..."
    if (!queryString && url.hash) {
      // 例: "#/new-deck-view/?deck=..."
      const qIndex = url.hash.indexOf('?');
      if (qIndex !== -1) {
        queryString = url.hash.slice(qIndex); // 先頭は "?"
      }
    }

    const params = new URLSearchParams((queryString || '').replace(/^\?/, ''));
    const deckParam = params.get('deck');
    if (!deckParam) return; // deck 指定なしは何もしない

    const [mainCode, sideCode] = deckParam.split('_');

    return fetch('/cards.json')
      .then((res) => res.json())
      .then((allCards) => {
        const safeDecrypt = (code) => {
          try { return decryptCode(code) || ''; } catch { return ''; }
        };

        const toDeck = (ids) =>
          ids
            .map((id) => allCards.find((c) => c.id === id))
            .filter((c) => c && c.name != null);

        // メイン
        const mainIds = safeDecrypt(mainCode).split('/').filter(Boolean);
        const mainDeck = toDeck(mainIds);
        setDeck(sortDeck(mainDeck));

        // サイド（無ければクリア）
        if (sideCode) {
          const sideIds = safeDecrypt(sideCode).split('/').filter(Boolean);
          const side = toDeck(sideIds);
          setSideDeck(sortDeck(side));
        } else {
          setSideDeck([]);
        }
      })
      .catch(() => {
        alert('デッキの読み込み中にエラーが発生しました。');
      });
  } catch (e) {
    alert('無効なURLです');
  }
};

// コード読込----------------------------------------------------------------------
export const handleCodeImport = (code, setDeck, setSideDeck) => {
    try {
        const parts = code.split("_");
        const mainCode = parts[0];
        const sideCode = parts[1];

        fetch('/cards.json')
            .then(res => res.json())
            .then(all => {
                const mainIds = decryptCode(mainCode).split("/");
                const mainDeck = mainIds
                    .map(id => all.find(card => card.id === id))
                    .filter(card => card && card.name);
                setDeck(sortDeck(mainDeck));

                if (sideCode) {
                    const sideIds = decryptCode(sideCode).split("/");
                    const sideDeck = sideIds
                        .map(id => all.find(card => card.id === id))
                        .filter(card => card && card.name);
                    setSideDeck(sortDeck(sideDeck));
                }
            });
    } catch (error) {
        alert("無効なデッキコードです");
    }
};

// テキストコピー------------------------------------------------------------------
const fallbackCopy = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('フォールバックコピー失敗:', err);
    }
    document.body.removeChild(textarea);
};

export const copyText = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
};

// デッキ画像生成------------------------------------------------------------------
export const generateDeckImageWithSideDeck = async (mainDeck, sideDeck = [], deckTitle) => {
    const newTab = window.open();

    setTimeout(async () => {
        const seenMain = new Set();
        const sortedMain = sortDeck(mainDeck).filter(card => {
            if (seenMain.has(card.id)) return false;
            seenMain.add(card.id);
            return true;
        });

        const seenSide = new Set();
        const sortedSide = sortDeck(sideDeck).filter(card => {
            if (seenSide.has(card.id)) return false;
            seenSide.add(card.id);
            return true;
        });

        // ✅ 背景画像の決定ロジック
        let totalUniqueCount = sortedMain.length;

        // 背景レベル決定（1〜6）
        let backgroundLevel = 1;
        // サイドがない場合は本来の段階でよい（+1しない）
        if (totalUniqueCount <= 10) backgroundLevel = 1;
        else if (totalUniqueCount <= 20) backgroundLevel = 2;
        else if (totalUniqueCount <= 30) backgroundLevel = 3;
        else if (totalUniqueCount <= 40) backgroundLevel = 4;
        else if (totalUniqueCount <= 50) backgroundLevel = 5;
        else backgroundLevel = 6;

        if (sortedSide.length > 0) {
            if (totalUniqueCount <= 10) totalUniqueCount = 10;
            else if (totalUniqueCount <= 20) totalUniqueCount = 20;
            else if (totalUniqueCount <= 30) totalUniqueCount = 30;
            else if (totalUniqueCount <= 40) totalUniqueCount = 40;
            else if (totalUniqueCount <= 50) totalUniqueCount = 50;
            else totalUniqueCount = 60;

            // サイドがある場合は +1段階背景を使う
            const uniqueIds = new Set([...sortedSide].map(card => card.id));
            totalUniqueCount = totalUniqueCount + sortedSide.length;

            if (totalUniqueCount > 50) backgroundLevel = 6;
            else if (totalUniqueCount > 40) backgroundLevel = 5;
            else if (totalUniqueCount > 30) backgroundLevel = 4;
            else if (totalUniqueCount > 20) backgroundLevel = 3;
            else backgroundLevel = 2;
        }

        const backgroundPath = `${process.env.PUBLIC_URL}/images/deck/Deck-${backgroundLevel}.png`;

        const background = new Image();
        background.src = backgroundPath;
        await new Promise((res) => { background.onload = res; });

        const canvas = document.createElement('canvas');
        canvas.width = background.width;
        canvas.height = background.height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(background, 0, 0);
        ctx.fillStyle = 'rgb(247, 249, 251)';
        ctx.font = 'bold 120px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`「${deckTitle || 'Deck'}」`, canvas.width / 2, 290);

        const cardWidth = 345;
        const cardHeight = 481;
        const cardsPerRow = 10;
        const offsetX = 364;
        const offsetY = 395;
        const gapX = 381;
        const gapY = 606;

        const mainCardCount = mainDeck.reduce((acc, card) => {
            acc[card.id] = (acc[card.id] || 0) + 1;
            return acc;
        }, {});
        const sideCardCount = sideDeck.reduce((acc, card) => {
            acc[card.id] = (acc[card.id] || 0) + 1;
            return acc;
        }, {});

        // メインデッキ描画
        for (let i = 0; i < sortedMain.length; i++) {
            const card = sortedMain[i];
            const image = new Image();
            image.src = `${process.env.PUBLIC_URL}/images/${card.id}.webp`;

            await new Promise(resolve => {
                image.onload = () => {
                    const col = i % cardsPerRow;
                    const row = Math.floor(i / cardsPerRow);
                    const x = offsetX + col * gapX;
                    const y = offsetY + row * gapY;

                    ctx.drawImage(image, x, y, cardWidth, cardHeight);
                    ctx.fillStyle = '#000';
                    ctx.font = '40px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(mainCardCount[card.id], x + cardWidth / 2, y + cardHeight + 70);
                    resolve();
                };
                image.onerror = resolve;
            });
        }

        // サイドデッキ描画（縁取りあり）
        const mainRows = Math.ceil(sortedMain.length / cardsPerRow);
        for (let i = 0; i < sortedSide.length; i++) {
            const card = sortedSide[i];
            const image = new Image();
            image.src = `${process.env.PUBLIC_URL}/images/${card.id}.webp`;

            await new Promise(resolve => {
                image.onload = () => {
                    const col = i % cardsPerRow;
                    const row = mainRows + Math.floor(i / cardsPerRow);
                    const x = offsetX + col * gapX;
                    const y = offsetY + row * gapY;

                    // ✅ サイドデッキの縁取り
                    ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)'; // オレンジ枠
                    ctx.lineWidth = 10;
                    ctx.strokeRect(x - 5, y - 5, cardWidth + 10, cardHeight + 10);

                    ctx.drawImage(image, x, y, cardWidth, cardHeight);
                    ctx.fillStyle = '#000';
                    ctx.font = '40px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(sideCardCount[card.id], x + cardWidth / 2, y + cardHeight + 70);
                    resolve();
                };
                image.onerror = resolve;
            });
        }

        canvas.toBlob((blob) => {
            if (blob && newTab) {
                const url = URL.createObjectURL(blob);
                newTab.location.href = url;
            }
        }, 'image/png');
    }, 0);
};
