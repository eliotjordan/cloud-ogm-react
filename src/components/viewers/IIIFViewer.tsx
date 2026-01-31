import Viewer from '@samvera/clover-iiif/viewer';

interface IIIFViewerProps {
  iiifContent: string;
}

/**
 * IIIF viewer using Clover IIIF library
 * Supports both IIIF Presentation API (manifests) and Image API
 */
export function IIIFViewer({ iiifContent }: IIIFViewerProps) {
  return (
    <div className="card overflow-hidden">
      <div>
        <Viewer
          iiifContent={iiifContent}
          options={{
            showTitle: false,
            showDownload: false,
            informationPanel: {
              renderAbout: false,
              renderToggle: false
            },

            openSeadragon: {
              gestureSettingsMouse: {
                scrollToZoom: true
              }
            }
          }}
        />
      </div>
    </div>
  );
}
