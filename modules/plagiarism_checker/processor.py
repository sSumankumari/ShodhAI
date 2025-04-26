import os
import tempfile
import shutil
import numpy as np
from werkzeug.utils import secure_filename
from concurrent.futures import ThreadPoolExecutor
from .utils import read_pdf_text
from .plag.cosine_similarity import cosine_similarity_count, cosine_similarity_tfidf
from .plag.jaccard_similarity import jaccard_similarity
from .plag.lcs import lcs
from .plag.lsh import lsh_similarity
from .plag.n_gram_similarity import n_gram_similarity

similarity_functions = {
    "Cosine_TFIDF": cosine_similarity_tfidf,
    "Cosine_Count": cosine_similarity_count,
    "Jaccard": jaccard_similarity,
    "LCS": lcs,
    "LSH": lsh_similarity,
    "NGram": n_gram_similarity
}

def compare_pair(i, j, file_names, texts):
    row = {
        "Doc 1": file_names[i],
        "Doc 2": file_names[j]
    }
    scores = []
    for name, func in similarity_functions.items():
        try:
            score = round(func(texts[i], texts[j]) * 100, 2)
        except Exception as e:
            print(f"Error computing {name}: {e}")
            score = 0.0
        row[name] = score
        scores.append(score)
    row["Average Similarity (%)"] = round(np.mean(scores), 2)
    return row

def compare_pdfs(pdf_files):
    file_names = [os.path.basename(p) for p in pdf_files]
    with ThreadPoolExecutor(max_workers=10) as executor:
        texts = list(executor.map(read_pdf_text, pdf_files))

    results = []
    with ThreadPoolExecutor() as executor:
        futures = [executor.submit(compare_pair, i, j, file_names, texts)
                   for i in range(len(pdf_files)) for j in range(i+1, len(pdf_files))]
        results = [f.result() for f in futures]
    return results

def process_uploaded_pdfs(files):
    temp_dir = tempfile.mkdtemp()
    file_paths = []
    try:
        for file in files:
            if file.filename.lower().endswith('.pdf'):
                path = os.path.join(temp_dir, secure_filename(file.filename))
                file.save(path)
                file_paths.append(path)
        return compare_pdfs(file_paths)
    finally:
        shutil.rmtree(temp_dir)
