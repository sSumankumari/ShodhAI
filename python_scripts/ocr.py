from paddleocr import PaddleOCR
import numpy as np
import cv2

# You can initialize PaddleOCR once for performance
_ocr_instance = None

def get_ocr_instance():
    global _ocr_instance
    if _ocr_instance is None:
        _ocr_instance = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
    return _ocr_instance

def extract_text_from_file(file_obj):
    """
    Extracts text from an uploaded image file-like object using PaddleOCR.
    Args:
        file_obj: File-like object (e.g., Flask's request.files['image'])
    Returns:
        str: Extracted text.
    Raises:
        ValueError: If the image cannot be processed or OCR fails.
    """
    try:
        file_bytes = np.frombuffer(file_obj.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Invalid or unsupported image file.")
        ocr = get_ocr_instance()
        results = ocr.ocr(img, cls=True)
        extracted_text = []
        for result in results:
            for line in result:
                extracted_text.append(line[1][0])
        return "\n".join(extracted_text).strip() or "No text detected in the image."
    except Exception as e:
        raise ValueError(f"OCR extraction failed: {str(e)}")