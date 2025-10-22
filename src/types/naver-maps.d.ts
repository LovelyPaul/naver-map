// Naver Maps SDK Type Declarations
// 네이버 지도 SDK 타입 선언

declare global {
  interface Window {
    naver?: {
      maps?: {
        Map: any;
        Marker: any;
        Size: any;
        Point: any;
        LatLng: any;
        LatLngBounds: any;
        Position: any;
        Event: any;
        // 기타 필요한 타입들은 실제 사용 시 추가
        [key: string]: any;
      };
    };
  }

  namespace naver {
    namespace maps {
      class Map {
        constructor(element: HTMLElement | string, options?: any);
        setCenter(center: LatLng | any): void;
        getCenter(): LatLng;
        setZoom(zoom: number, animate?: boolean): void;
        getZoom(): number;
        getBounds(): LatLngBounds;
        panTo(coord: LatLng | any, options?: any): void;
        fitBounds(bounds: LatLngBounds, options?: any): void;
        destroy(): void;
      }

      class Marker {
        constructor(options: any);
        setMap(map: Map | null): void;
        getMap(): Map | null;
        setPosition(position: LatLng | any): void;
        getPosition(): LatLng;
        setTitle(title: string): void;
        setIcon(icon: any): void;
        setVisible(visible: boolean): void;
        setClickable(clickable: boolean): void;
        setDraggable(draggable: boolean): void;
        setZIndex(zIndex: number): void;
      }

      class LatLng {
        constructor(lat: number, lng: number);
        lat(): number;
        lng(): number;
        equals(other: LatLng): boolean;
        toString(): string;
      }

      class LatLngBounds {
        constructor(sw: LatLng, ne: LatLng);
        extend(coord: LatLng): LatLngBounds;
        getCenter(): LatLng;
        getSW(): LatLng;
        getNE(): LatLng;
        hasLatLng(latlng: LatLng): boolean;
      }

      class Size {
        constructor(width: number, height: number);
        width: number;
        height: number;
      }

      class Point {
        constructor(x: number, y: number);
        x: number;
        y: number;
      }

      namespace Event {
        function addListener(
          target: any,
          eventName: string,
          listener: (...args: any[]) => void
        ): any;
        function removeListener(listener: any): void;
        function clearListeners(target: any, eventName?: string): void;
      }

      enum Position {
        TOP_LEFT,
        TOP_CENTER,
        TOP_RIGHT,
        LEFT_CENTER,
        CENTER,
        RIGHT_CENTER,
        BOTTOM_LEFT,
        BOTTOM_CENTER,
        BOTTOM_RIGHT,
      }
    }
  }
}

export {};
