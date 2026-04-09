import { useDocViewerContext } from '../context/DocViewerContext';

export function useZoom() {
  const { state, actions } = useDocViewerContext();

  return {
    level: state.zoom,
    setZoom: actions.setZoom,
    zoomIn: actions.zoomIn,
    zoomOut: actions.zoomOut,
    resetZoom: actions.resetZoom,
    fitToWidth: actions.fitToWidth,
    percentage: Math.round(state.zoom * 100),
  };
}
