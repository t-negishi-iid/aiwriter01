Next.jsとReactでのコンポーネント全画面表示方法

## 概要

Next.jsとReactを使用して、特定のコンポーネントを全画面表示する方法を解説します。ユーザーの操作に応じて、特定の要素を全画面表示することで、よりインタラクティブなユーザー体験を提供できます。

1. フルスクリーンAPIの利用
ブラウザのフルスクリーンAPIを使用して、任意の要素を全画面表示できます。以下の手順で実装します。

1.1 フルスクリーンAPIの基本
フルスクリーン表示したい要素に対して、requestFullscreen()メソッドを呼び出します。

```javascript
function enterFullScreen() {
  const element = document.getElementById('fullScreenElement');
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) { /*Safari */
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) { /* IE11*/
    element.msRequestFullscreen();
  }
}
```

1.2 Reactコンポーネントでの実装

```javascript
import { useRef } from 'react';

function FullScreenComponent() {
  const fullScreenRef = useRef(null);

  const handleFullScreen = () => {
    if (fullScreenRef.current.requestFullscreen) {
      fullScreenRef.current.requestFullscreen();
    } else if (fullScreenRef.current.webkitRequestFullscreen) {
      fullScreenRef.current.webkitRequestFullscreen();
    } else if (fullScreenRef.current.msRequestFullscreen) {
      fullScreenRef.current.msRequestFullscreen();
    }
  };

  return (
    <div ref={fullScreenRef} id="fullScreenElement">
      <button onClick={handleFullScreen}>全画面表示</button>
      {/*その他のコンテンツ*/}
    </div>
  );
}

export default FullScreenComponent;
```

2. CSSによる全画面風表示

CSSを活用して、特定の要素を画面全体に表示する方法です。フルスクリーンAPIを使用しないため、互換性の問題を回避できます。

2.1 ステート管理とCSSクラスの切り替え

```javascript
import { useState } from 'react';
import styles from './FullScreenToggle.module.css';

function FullScreenToggle() {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div className={isFullScreen ? styles.fullScreen : styles.normal}>
      <button onClick={toggleFullScreen}>
        {isFullScreen ? '通常表示' : '全画面表示'}
      </button>
      {/*表示するコンテンツ*/}
    </div>
  );
}

export default FullScreenToggle;
```

2.2 CSSスタイルの定義

```css
/*FullScreenToggle.module.css */
.normal {
  /* 通常時のスタイル*/
}

.fullScreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: white;
  z-index: 1000;
}
```

3. ライブラリの活用
既存のライブラリを使用して、全画面表示機能を簡単に実装することも可能です。

3.1 react-full-screenの利用

react-full-screenは、Reactコンポーネントを全画面表示するためのライブラリです。

```bash
npm install react-full-screen
```

```jsx
import React from 'react';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';

function App() {
  const handle = useFullScreenHandle();

  return (
    <div>
      <button onClick={handle.enter}>全画面表示</button>
      <FullScreen handle={handle}>
        {/*全画面表示するコンテンツ*/}
        <button onClick={handle.exit}>全画面解除</button>
      </FullScreen>
    </div>
  );
}

export default App;
```

参考資料
[MDN Web Docs: フルスクリーンAPI](https://developer.mozilla.org/ja/docs/Web/API/Fullscreen_API)

[Qiita: Reactで簡単にフルスクリーンのスライドショーを作る](https://qiita.com/kijibato/items/8f142535b9897ee02b3e)
