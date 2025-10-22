import { useState, useEffect, useRef, type RefObject } from 'react';

// Hook này cho phép bạn phát hiện khi một phần tử hiển thị trên màn hình.
// Nó trả về một ref để gắn vào phần tử và một boolean cho biết nó có đang trong viewport hay không.
// FIX: Import RefObject type from React and use it directly to fix React namespace error.
export function useOnScreen<T extends Element>(options?: IntersectionObserverInit): [RefObject<T>, boolean] {
    const ref = useRef<T>(null);
    const [isIntersecting, setIntersecting] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            // Cập nhật state khi callback của observer được kích hoạt
            if (entry.isIntersecting) {
                setIntersecting(true);
                // Sau khi phát hiện, chúng ta không cần quan sát nữa
                observer.unobserve(entry.target);
            }
        }, options);

        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [ref, options]); 

    return [ref, isIntersecting];
}