import type { ReactNode } from 'react';

export interface DataTableColumn {
  header: string;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn[];
  gridCols: string;
  items: T[];
  rowKey: (item: T) => string;
  renderRow: (item: T) => ReactNode;
  renderMobileCard: (item: T) => ReactNode;
  emptyMessage: string;
  maxHeight?: string;
  onRowClick?: (item: T) => void;
  onRowDoubleClick?: (item: T) => void;
  isRowSelected?: (item: T) => boolean;
  containerClassName?: string;
  mobileClassName?: string;
}

export function DataTable<T>({
  columns,
  gridCols,
  items,
  rowKey,
  renderRow,
  renderMobileCard,
  emptyMessage,
  maxHeight = '420px',
  onRowClick,
  onRowDoubleClick,
  isRowSelected,
  containerClassName = '',
  mobileClassName = 'pb-28',
}: DataTableProps<T>) {
  return (
    <>
      {/* DESKTOP */}
      <div className={['hidden md:block border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white', containerClassName].filter(Boolean).join(' ')}>
        <div className={`grid ${gridCols} bg-gray-50 border-b border-gray-100 px-6 py-4`}>
          {columns.map(col => (
            <span key={col.header} className={['text-[10px] font-bold text-gray-400 uppercase tracking-widest', col.className].filter(Boolean).join(' ')}>
              {col.header}
            </span>
          ))}
        </div>
        {items.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">{emptyMessage}</p>
        ) : (
          <div
            className="overflow-y-auto custom-scrollbar divide-y divide-gray-50"
            style={{ maxHeight }}
          >
            {items.map(item => {
              const selected = isRowSelected?.(item) ?? false;
              return (
                <div
                  key={rowKey(item)}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(item) : undefined}
                  className={[
                    `grid ${gridCols} px-6 py-4 items-center transition-colors`,
                    onRowClick ? 'cursor-pointer' : '',
                    selected ? 'bg-red-50 border-l-2 border-l-[#B5071A]' : 'hover:bg-gray-50',
                  ].filter(Boolean).join(' ')}
                >
                  {renderRow(item)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MOBILE */}
      <div className={['md:hidden space-y-3', mobileClassName].filter(Boolean).join(' ')}>
        {items.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">{emptyMessage}</p>
        ) : items.map(item => {
          const selected = isRowSelected?.(item) ?? false;
          return (
            <div
              key={rowKey(item)}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(item) : undefined}
              className={[
                'border rounded-xl p-4 shadow-sm transition-all',
                onRowClick ? 'cursor-pointer' : '',
                selected ? 'bg-red-50 border-[#B5071A]' : 'bg-gray-50 border-gray-100',
              ].filter(Boolean).join(' ')}
            >
              {renderMobileCard(item)}
            </div>
          );
        })}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d9d9d9; border-radius: 10px; }
      `}</style>
    </>
  );
}
