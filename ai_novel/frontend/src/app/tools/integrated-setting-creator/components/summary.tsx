// integrater-setting-creatorの各タブで選択した選択肢名の一覧を表示するコンポーネント
// 各コンポーネントから現在の選択状態ステートを取得取得して見出し部分を表示する

// SelectedDataインターフェースを直接定義
interface SelectedData {
  theme?: {
    title: string;
    description?: string;
    examples?: string[];
    category?: string;
    subcategory?: string;
  };
  timePlace?: {
    category: string;
    title: string;
    description?: string;
  };
  worldSetting?: {
    category: string;
    title: string;
    description?: string;
  };
  writingStyle?: {
    author: string;
    title?: string;
    description?: string;
  };
  emotional?: {
    selectedElements?: Array<{
      category: string;
      element: string;
      description?: string;
    }>;
  };
  pastMystery?: {
    title: string;
    description?: string;
  };
  plotPattern?: {
    title: string;
    description?: string;
  };
  [key: string]: unknown; // 他のプロパティも許可
}

interface SummaryProps {
  selectedData: SelectedData;
}

export default function Summary({ selectedData }: SummaryProps) {
  return (
    <div className="p-4 bg-white rounded-md shadow-sm">
      <h2 className="text-xl font-bold mb-4">選択内容一覧</h2>

      {Object.keys(selectedData).length === 0 ? (
        <p className="text-gray-500">まだ何も選択されていません</p>
      ) : (
        <ul className="space-y-10">
          <li className="border-b pb-2 y-m-10">
            <span className="font-semibold">テーマ（主題）：</span>
            {selectedData.theme ? (
              <>
                {selectedData.theme.title}
                {selectedData.theme.category && (
                  <div className="text-sm text-gray-600 mt-1">
                    カテゴリ: {selectedData.theme.category}
                    {selectedData.theme.subcategory && ` > ${selectedData.theme.subcategory}`}
                  </div>
                )}
              </>
            ) : (
              <span className="text-red-300 ml-1">未選択</span>
            )}
          </li>

          <li className="border-b pb-2 y-m-10">
            <span className="font-semibold">時代と場所：</span>
            {selectedData.timePlace ? (
              <>
                {selectedData.timePlace.title}
                {selectedData.timePlace.category && (
                  <div className="text-sm text-gray-600 mt-1">
                    カテゴリ: {selectedData.timePlace.category}
                  </div>
                )}
              </>
            ) : (
              <span className="text-red-300 ml-1">未選択</span>
            )}
          </li>

          <li className="border-b pb-2 y-m-10">
            <span className="font-semibold">作品世界と舞台設定：</span>
            {selectedData.worldSetting ? (
              <>
                {selectedData.worldSetting.title}
                {selectedData.worldSetting.category && (
                  <div className="text-sm text-gray-600 mt-1">
                    カテゴリ: {selectedData.worldSetting.category}
                  </div>
                )}
              </>
            ) : (
              <span className="text-red-300 ml-1">未選択</span>
            )}
          </li>

          <li className="border-b pb-2 y-m-10">
            <span className="font-semibold">参考とする作風：</span>
            {selectedData.writingStyle ? (
              <>
                {selectedData.writingStyle.author}
                {selectedData.writingStyle.title && (
                  <div className="text-sm text-gray-600 mt-1">
                    作品名: {selectedData.writingStyle.title}
                  </div>
                )}
              </>
            ) : (
              <span className="text-red-300 ml-1">未選択</span>
            )}
          </li>

          <li className="border-b pb-2 y-m-10">
            <span className="font-semibold">情緒・感覚的要素：</span>
            {selectedData.emotional?.selectedElements && selectedData.emotional.selectedElements.length > 0 ? (
              <div className="text-sm mt-1">
                {selectedData.emotional.selectedElements.map((item, index) => (
                  <span key={index} className="inline-block bg-gray-100 rounded px-2 py-1 mr-2 mb-2" style={{ padding: '2px 4px' }}>
                    {item.element}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-red-300 ml-1">未選択</span>
            )}
          </li>

          <li className="border-b pb-2 y-m-10">
            <span className="font-semibold">物語の背景となる過去の謎：</span>
            {selectedData.pastMystery ? (
              selectedData.pastMystery.title
            ) : (
              <span className="text-red-300 ml-1">未選択</span>
            )}
          </li>

          <li className="border-b pb-2 y-m-10">
            <span className="font-semibold">プロットパターン：</span>
            {selectedData.plotPattern ? (
              selectedData.plotPattern.title
            ) : (
              <span className="text-red-300 ml-1">未選択</span>
            )}
          </li>
        </ul>
      )}
    </div>
  );
}
