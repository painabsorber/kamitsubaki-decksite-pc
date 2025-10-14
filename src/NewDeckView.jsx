import './App.css';
import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    encryptDeckPair,
    importDeckFromURL,
    handleCodeImport,
    decodeDeckFromParam,
    copyText,
    collectionList,
    generateDeckImageWithSideDeck,
    sortDeck
} from './utils/deckUtils';

const NewDeckView = () => {
    const [cards, setCards] = useState([]);
    const [deck, setDeck] = useState([]);
    const [sideDeck, setSideDeck] = useState([]);
    const [selectedCard, setSelectedCard] = useState(null);
    const [importURL, setImportURL] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedColor, setSelectedColor] = useState('Any');
    const [selectedSubColor, setSelectedSubColor] = useState('');
    const [selectedCollection, setSelectedCollection] = useState('All');
    const [deckTitle, setDeckTitle] = useState('');
    const rightPaneRef = useRef(null);
    const [showTopButton, setShowTopButton] = useState(false);
    const [activeView, setActiveView] = useState('main');
    const [popupImage, setPopupImage] = useState(null);
    const [selectedEffects, setSelectedEffects] = useState({
        魔力α: false,
        魔力β: false,
        魔力Ω: false,
        VOL: false
    });


    useEffect(() => {
        const handleScroll = () => {
            if (rightPaneRef.current) {
                setShowTopButton(rightPaneRef.current.scrollTop > 100);
            }
        };

        const scrollContainer = rightPaneRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (scrollContainer) {
                scrollContainer.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    useEffect(() => {
        fetch('/cards.json')
            .then(res => res.json())
            .then(data => {
                const checkImageExists = (card) => {
                    return new Promise((resolve) => {
                        const img = new Image();
                        img.src = `${process.env.PUBLIC_URL}/images/${card.id}.webp`;
                        img.onload = () => resolve(card);
                        img.onerror = () => resolve(null);
                    });
                };

                Promise.all(data.map(checkImageExists)).then(results => {
                    const validCards = results.filter(Boolean);
                    setCards(validCards);
                });
            });
    }, []);

    useEffect(() => {
        const fullURL = window.location.href;
        const match = fullURL.match(/deck=([^&]+)/);
        const deckParam = match ? decodeURIComponent(match[1]) : null;
        decodeDeckFromParam(deckParam, setDeck, setSideDeck);
    }, []);

    useEffect(() => {
        const scrollContainer = rightPaneRef.current;
        if (!scrollContainer) return;

        const handleScroll = () => {
            setShowTopButton(scrollContainer.scrollTop > 100);
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        return () => {
            scrollContainer.removeEventListener('scroll', handleScroll);
        };
    }, [rightPaneRef.current]);

    const addToDeck = (card) => {
        const totalIdCount = [...deck, ...sideDeck].filter(c => c.id === card.id).length;
        if (totalIdCount >= 4) return;

        const totalNameCount = [...deck, ...sideDeck].filter(c => c.name === card.name).length;
        if (totalNameCount >= 4) return;

        setDeck(prev => [...prev, card]);
    };

    const removeFromDeckByCard = (targetCard) => {
        const index = deck.findIndex(
            c => c.id === targetCard.id && c.name === targetCard.name
        );
        if (index !== -1) {
            const newDeck = [...deck];
            newDeck.splice(index, 1);
            setDeck(newDeck);
        }
    };

    const addToSideDeck = (card) => {
        const totalIdCount = [...deck, ...sideDeck].filter(c => c.id === card.id).length;
        if (totalIdCount >= 4) return;

        const totalNameCount = [...deck, ...sideDeck].filter(c => c.name === card.name).length;
        if (totalNameCount >= 4) return;

        setSideDeck(prev => [...prev, card]);
    };

    const removeFromSideDeckByCard = (targetCard) => {
        const index = sideDeck.findIndex(
            c => c.id === targetCard.id && c.name === targetCard.name
        );
        if (index !== -1) {
            const newDeck = [...sideDeck];
            newDeck.splice(index, 1);
            setSideDeck(newDeck);
        }
    };

    const filteredCards = cards.filter(card => {
        const keywords = searchKeyword.toLowerCase().split(/\s+/).filter(Boolean);

        const searchableText = [
            card.name?.toLowerCase() || '',
            card.id?.toLowerCase() || '',
            card.description?.toLowerCase() || ''
        ].join(' ');

        const matchesAllKeywords = keywords.every(word => searchableText.includes(word));
        const matchesCategory = selectedCategory === 'All' || card.type === selectedCategory;
        const selectedColorInternal = selectedColor === 'ALL' ? '全' : selectedColor;
        const matchesCollection =
            selectedCollection === 'All' ||
            (Array.isArray(card.collection)
                ? card.collection.includes(selectedCollection)
                : typeof card.collection === 'string' &&
                card.collection.split(/\r?\n/).map(s => s.trim()).includes(selectedCollection));

        let matchesColor = true;
        if (selectedColor !== 'Any') {
            if (selectedSubColor) {
                const target1 = selectedColorInternal + selectedSubColor;
                const target2 = selectedSubColor + selectedColorInternal;
                matchesColor = card.color === target1 || card.color === target2;
            } else {
                matchesColor = card.color && card.color.startsWith(selectedColorInternal);
            }
        }

        const selectedEffectKeys = Object.entries(selectedEffects)
            .filter(([_, checked]) => checked)
            .map(([key]) => key);

        const effectText = (() => {
            const match = card.description?.match(/【登場時効果】([^\n\r]*)/);
            return match ? match[1] : '';
        })();

        const matchesEffects = selectedEffectKeys.every(effect =>
            effectText.includes(effect)
        );

        return matchesAllKeywords && matchesCategory && matchesColor && matchesCollection && matchesEffects;
    });

    const handleSingleSelect = (key) => {
        setSelectedEffects((prev) => {
            if (prev[key]) return prev;

            const next = Object.fromEntries(Object.keys(prev).map(k => [k, false]));
            next[key] = true;
            return next;
        });
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '300px 1fr 320px',
            height: '100vh',
            overflow: 'hidden',
            alignItems: 'start'
        }}>
            {/* 左：カード詳細 */}
            <aside style={{
                borderRight: '1px solid #ccc',
                padding: '1rem',
                paddingTop: '0.1rem',
                overflowY: 'auto',
                position: 'relative',
                height: '100vh'
            }}>
                <h2 style={{ margin: '0 0 0.5rem 0' }}>カード説明</h2>
                {selectedCard ? (
                    <>
                        <img
                        src={`${process.env.PUBLIC_URL}/images/${selectedCard.id}.webp`}
                        alt={selectedCard.name}
                        style={{ width: '100%', borderRadius: '8px', cursor: 'pointer' }}
                        onClick={() => setPopupImage(`${process.env.PUBLIC_URL}/images/${selectedCard.id}.webp`)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            if (!selectedCard) return;
                            if (activeView === 'main') {
                            addToDeck(selectedCard);
                            } else {
                            addToSideDeck(selectedCard);
                            }
                        }}
                        />
                        <h3>{selectedCard.name}</h3>
                        <pre style={{ whiteSpace: 'pre-wrap' }}>{selectedCard.description}</pre>
                    </>
                ) : (
                    <p>カードを選択してください</p>
                )}
                <div className="deck-controls-inside">
                    <input
                        type="text"
                        placeholder="デッキタイトルを入力"
                        value={deckTitle}
                        onChange={(e) => setDeckTitle(e.target.value)}
                        style={{
                            width: '100%',
                            marginBottom: '0.5rem',
                            padding: '0.4rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                    />

                    <button
                        onClick={() => generateDeckImageWithSideDeck(deck, sideDeck, deckTitle)}
                        style={{
                            width: '100%',
                            marginBottom: '0.5rem',
                            padding: '0.5rem',
                            backgroundColor: '#6c63ff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        🖼 デッキ画像を生成
                    </button>

                    <div className="button-group">
                        <button
                            onClick={() => {
                                if (deck.length === 0 || deck.length > 60) return;
                                const code = encryptDeckPair(deck, sideDeck);
                                const url = `${window.location.origin}${window.location.pathname}#/new-deck-view/?deck=${code}`;
                                copyText(url);
                            }}
                        >
                        🔗 URLコピー
                        </button>
                        <button
                            onClick={() => {
                                if (deck.length === 0 || deck.length > 60) return;
                                const code = encryptDeckPair(deck, sideDeck);
                                copyText(code);
                            }}
                        >
                        🔐 コードコピー
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            const fullList = [...deck];
                            const idList = fullList.map(card => card.id).join('/');
                            copyText(idList);
                        }}
                        style={{
                            width: '100%',
                            marginBottom: '0.5rem',
                            padding: '0.5rem',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        📋 フルコードコピー
                    </button>

                    <input
                        type="text"
                        placeholder="URLまたはコードを貼り付け"
                        value={importURL}
                        onChange={(e) => setImportURL(e.target.value)}
                        style={{ marginBottom: '0.5rem', width: '100%' }}
                    />

                    <div className="button-group">
                        <button onClick={() => importDeckFromURL(importURL, setDeck, setSideDeck)}>
                            🔄 URL読み込み
                        </button>
                        <button
                            onClick={() => handleCodeImport(importURL, setDeck, setSideDeck)}
                        >
                            🛠 コード読み込み
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            if (window.confirm("メインデッキとサイドデッキをすべて削除しますか？")) {
                                setDeck([]);
                                setSideDeck([]);
                            }
                        }}
                        style={{ width: '100%', backgroundColor: '#dc3545', color: 'white' }}
                    >
                        🗑 デッキをすべて削除
                    </button> 
               </div>
            </aside>

            {/* 中央：カード画像のグリッド表示 */}
            <main style={{
                padding: '1rem',
                paddingTop: '0.1rem',
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                boxSizing: 'border-box'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ margin: '0 0 0.5rem 0' }}>
                        {activeView === 'main'
                            ? `メインデッキ（${deck.length}枚）左クリック/詳細 右クリック/削除`
                            : `サイドデッキ（${sideDeck.length}枚）左クリック/詳細 右クリック/削除`}
                    </h2>
                    <button
                        onClick={() => setActiveView(prev => prev === 'main' ? 'side' : 'main')}
                        style={{
                            padding: '0.4rem 0.8rem',
                            fontSize: '14px',
                            borderRadius: '6px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        {activeView === 'main' ? '▶ サイドデッキ表示' : '◀ メインデッキ表示'}
                    </button>
                </div>
                <div style={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(10, 1fr)',
                    gridTemplateRows: 'repeat(6, 1fr)',
                    gap: '4px',
                    height: 'calc(100vh - 4rem)'
                }}>
                    {sortDeck(activeView === 'main' ? deck : sideDeck).map((card, index) => (
                    <div
                        key={`${card.id}-${index}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                        }}
                        onClick={() => setSelectedCard(card)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            if (activeView === 'main') {
                                removeFromDeckByCard(card);
                            } else {
                                removeFromSideDeckByCard(card);
                            }
                        }}
                    >
                        <img
                            src={`${process.env.PUBLIC_URL}/images/${card.id}.webp`}
                            alt={card.name}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                borderRadius: '4px',
                                userSelect: 'none',
                                cursor: 'pointer',
                            }}
                        />
                    </div>
                    ))}
                </div>
            </main>

            {/* 右：カード一覧 */}
            <aside
                ref={rightPaneRef}
                style={{
                    borderLeft: '1px solid #ccc',
                    padding: '1rem',
                    paddingTop: '0.1rem',
                    overflowY: 'scroll',
                    height: '100vh',
                    alignItems: 'start',
                    position: 'relative'
                }}
            >
                <h3>カード検索</h3>
                <label>収録弾：</label>
                <select
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                    style={{ marginBottom: '0.5rem', width: '100%' }}
                >
                    <option value="All">すべて</option>
                    {collectionList.map(col => (
                        <option key={col} value={col}>{col}</option>
                    ))}
                </select>

                <label>カテゴリ：</label>
                <select
                    value={selectedCategory}
                    onChange={(e) => {
                        const value = e.target.value;
                        setSelectedCategory(value);
                        if (value === 'Magic' || value === 'Direction') {
                            setSelectedColor('Any');
                            setSelectedSubColor('');
                        }
                    }}
                    style={{ marginBottom: '0.5rem', width: '100%' }}
                >
                    <option value="All">すべて</option>
                    <option value="Artist">Artist</option>
                    <option value="Song">Song</option>
                    <option value="Magic">Magic</option>
                    <option value="Direction">Direction</option>
                </select>

                <label>色：</label>
                <select
                    value={selectedColor}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSelectedColor(value)
                            
                            if (value === selectedSubColor) {
                                setSelectedSubColor('');
                            }
                        }}
                    style={{ marginBottom: '0.5rem', width: '100%' }}
                >
                    <option value="Any">すべて</option>
                    <option value="赤">赤</option>
                    <option value="青">青</option>
                    <option value="黄">黄</option>
                    <option value="白">白</option>
                    <option value="黒">黒</option>
                    <option value="ALL">ALL</option>
                </select>

                {["赤", "青", "黄", "白", "黒"].includes(selectedColor) && (
                    <>
                        <label>副色：</label>
                        <select
                            value={selectedSubColor}
                            onChange={(e) => setSelectedSubColor(e.target.value)}
                            style={{ marginBottom: '0.5rem', width: '100%' }}
                        >
                            <option value="">指定なし</option>
                            {["赤", "青", "黄", "白", "黒"].filter(c => c !== selectedColor).map(color => (
                                <option key={color} value={color}>{color}</option>
                            ))}
                        </select>
                    </>
                )}

                <div style={{ margin: '0.3rem 0' }}>
                    <label>登場時効果：</label>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        {Object.keys(selectedEffects).map((key) => {
                        const checked = !!selectedEffects[key];
                        return (
                            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} className="inline-label">
                            <input
                                type="checkbox"
                                className="inline-checkbox"
                                checked={checked}
                                onChange={() => handleSingleSelect(key)}
                            />
                            {key}
                            </label>
                        );
                        })}
                    </div>
                </div>

                <label>キーワード：</label>
                <input
                    type="text"
                    placeholder="名前・ID・テキスト..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    style={{ marginBottom: '1rem', width: '100%' }}
                />

                <hr style={{ margin: '1rem 0' }} />
                <h2 style={{ margin: '0 0 0.5rem 0' }}>カード一覧</h2>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>左クリック/詳細  右クリック/追加</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {filteredCards.map(card => (
                        <div
                            key={card.id}
                            style={{ textAlign: 'center' }}
                            onClick={() => setSelectedCard(card)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                if (activeView === 'main') {
                                    addToDeck(card);
                                } else {
                                    addToSideDeck(card);
                                }
                            }}
                            >
                            <img
                                src={`${process.env.PUBLIC_URL}/images/${card.id}.webp`}
                                alt={card.name}
                                style={{ width: '100%', borderRadius: '8px', cursor: 'pointer', userSelect: 'none' }}
                            />
                        </div>
                    ))}
                </div>
            </aside>
            {showTopButton && (
                <button
                    onClick={() => {
                        if (rightPaneRef.current) {
                            rightPaneRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }}
                    style={{
                        position: 'absolute',
                        bottom: '20px',
                        right: '20px',
                        padding: '0.6rem 1rem',
                        fontSize: '16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '999px',
                        cursor: 'pointer',
                        zIndex: 1000,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}
                >
                    ⬆ Top
                </button>
            )}

            {popupImage && (
                <div
                    onClick={() => setPopupImage(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0,0,0,0.75)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999,
                        cursor: 'pointer'
                    }}
                >
                    <img
                        src={popupImage}
                        alt="拡大画像"
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            borderRadius: '8px',
                            boxShadow: '0 0 15px rgba(0,0,0,0.5)'
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default NewDeckView;