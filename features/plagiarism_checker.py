import re
import numpy as np
from PyPDF2 import PdfReader
from plag.cosine_similarity import cosine_similarity_count, cosine_similarity_tfidf
from plag.jaccard_similarity import jaccard_similarity
from plag.lcs import lcs
from plag.lsh import lsh_similarity
from plag.n_gram_similarity import n_gram_similarity
from concurrent.futures import ThreadPoolExecutor


def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    return text


def extract_text_from_pdf(file_obj):
    try:
        reader = PdfReader(file_obj)
        text = ''
        for page in reader.pages:
            text += page.extract_text() or ''
        return preprocess_text(text)
    except Exception as e:
        raise ValueError(f"Error reading PDF: {e}")


def extract_text_from_file(file_obj, filename=None):
    # Determine by extension if PDF, otherwise treat as text
    if filename and filename.lower().endswith('.pdf'):
        return extract_text_from_pdf(file_obj)
    else:
        try:
            text = file_obj.read().decode('utf-8')
            return preprocess_text(text)
        except Exception as e:
            raise ValueError(f"Error reading text file: {e}")


def compare_texts(texts, file_names=None):
    """
    Compares a list of texts using similarity functions.
    Returns a list of dicts with similarity results for each document pair.
    """
    file_names = file_names if file_names else [f"Doc_{i + 1}" for i in range(len(texts))]
    similarity_functions = {
        "Cosine_TFIDF": cosine_similarity_tfidf,
        "Cosine_Count": cosine_similarity_count,
        "Jaccard": jaccard_similarity,
        "LCS": lcs,
        "LSH": lsh_similarity,
        "NGram": n_gram_similarity
    }

    def compare_pair(i, j):
        row = {
            "Doc 1": file_names[i],
            "Doc 2": file_names[j]
        }
        scores = []
        for name, func in similarity_functions.items():
            try:
                score = round(func(texts[i], texts[j]) * 100, 2)
            except Exception:
                score = 0.0
            row[name] = score
            scores.append(score)
        row["Average Similarity (%)"] = round(np.mean(scores), 2)
        return row

    results = []
    with ThreadPoolExecutor() as executor:
        futures = []
        for i in range(len(texts)):
            for j in range(i + 1, len(texts)):
                futures.append(executor.submit(compare_pair, i, j))
        for future in futures:
            results.append(future.result())
    return results


def check_plagiarism_from_files(file_objs, file_names):
    """
    file_objs: list of file-like objects (uploaded files)
    file_names: list of filenames (to identify type and for reporting)
    Returns: list of similarity result dicts
    """
    texts = []
    for file_obj, fname in zip(file_objs, file_names):
        file_obj.seek(0)  # Always reset before reading
        texts.append(extract_text_from_file(file_obj, fname))
    return compare_texts(texts, file_names)


def check_plagiarism_from_strings(texts, names=None):
    """
    texts: list of strings
    names: list of labels for reporting (optional)
    Returns: list of similarity result dicts
    """
    processed_texts = [preprocess_text(t) for t in texts]
    return compare_texts(processed_texts, names)