'use client';

import { PlotData } from '../lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import styles from '../plot-detail.module.css';

interface PlotListProps {
  plots: PlotData[];
  selectedPlotId?: number;
  onSelect: (plot: PlotData) => void;
}

export function PlotList({ plots, selectedPlotId, onSelect }: PlotListProps) {
  return (
    <div className={styles.plotList}>
      {plots.map((plot) => (
        <Card
          key={plot.id}
          className={`mb-2 cursor-pointer hover:bg-gray-50 ${
            selectedPlotId === plot.id ? 'border-primary' : ''
          }`}
          onClick={() => onSelect(plot)}
        >
          <CardContent className="p-4">
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <h3 className="font-medium">{plot.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{plot.content}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
