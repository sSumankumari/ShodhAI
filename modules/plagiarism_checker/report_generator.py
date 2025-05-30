from datetime import datetime

def generate_html_report(results, file_names):
    report_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    table_rows = ""
    for result in results:
        table_rows += f"""
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">{result["Doc 1"]}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">{result["Doc 2"]}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">{result["Cosine_TFIDF"]}%</td>
            <td style="border: 1px solid #ddd; padding: 8px;">{result["Cosine_Count"]}%</td>
            <td style="border: 1px solid #ddd; padding: 8px;">{result["Jaccard"]}%</td>
            <td style="border: 1px solid #ddd; padding: 8px;">{result["LCS"]}%</td>
            <td style="border: 1px solid #ddd; padding: 8px;">{result["LSH"]}%</td>
            <td style="border: 1px solid #ddd; padding: 8px;">{result["NGram"]}%</td>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">{result["Average Similarity (%)"]}%</td>
        </tr>
        """

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Document Similarity Report - {report_date}</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            h1, h2 {{ color: #2563eb; }}
            table {{ border-collapse: collapse; width: 100%; margin-bottom: 20px; }}
            th {{ background-color: #f1f5f9; text-align: left; padding: 12px; border: 1px solid #ddd; }}
            td {{ padding: 8px; border: 1px solid #ddd; }}
            tr:nth-child(even) {{ background-color: #f9fafb; }}
            .summary {{ margin-bottom: 20px; }}
        </style>
    </head>
    <body>
        <h1>Document Similarity Analysis Report</h1>
        <div class="summary">
            <p><strong>Generated on:</strong> {report_date}</p>
            <p><strong>Files analyzed:</strong> {len(file_names)}</p>
            <p><strong>File names:</strong> {', '.join(file_names)}</p>
        </div>

        <h2>Similarity Results</h2>
        <table>
            <thead>
                <tr>
                    <th>Doc 1</th>
                    <th>Doc 2</th>
                    <th>Cosine_TFIDF (%)</th>
                    <th>Cosine_Count (%)</th>
                    <th>Jaccard (%)</th>
                    <th>LCS (%)</th>
                    <th>LSH (%)</th>
                    <th>NGram (%)</th>
                    <th>Average (%)</th>
                </tr>
            </thead>
            <tbody>
                {table_rows}
            </tbody>
        </table>

        <h2>Metrics Explanation</h2>
        <table>
            <thead>
                <tr>
                    <th style="width: 25%;">Metric</th>
                    <th style="width: 75%;">Explanation</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Cosine TF-IDF</strong></td>
                    <td>Measures similarity by treating documents as vectors, with words weighted by their importance. Higher scores indicate documents share important terms, not just common words.</td>
                </tr>
                <tr>
                    <td><strong>Cosine Count</strong></td>
                    <td>Similar to Cosine TF-IDF but uses raw word counts instead of weighted values. Measures how similar the word distributions are between documents.</td>
                </tr>
                <tr>
                    <td><strong>Jaccard</strong></td>
                    <td>Compares the shared words between documents to the total unique words in both. Focuses on word overlap regardless of frequency or order.</td>
                </tr>
                <tr>
                    <td><strong>LCS</strong></td>
                    <td>Finds the longest sequence of words that appear in the same order in both documents. Good for detecting large blocks of identical text.</td>
                </tr>
                <tr>
                    <td><strong>LSH</strong></td>
                    <td>Uses hashing to quickly identify similar document segments. Effective for detecting partial matches and document sections that have been copied.</td>
                </tr>
                <tr>
                    <td><strong>NGram</strong></td>
                    <td>Compares sequences of consecutive words (typically 3-5 words) between documents. Good for identifying phrase-level similarity and paraphrasing.</td>
                </tr>
                <tr>
                    <td><strong>Average</strong></td>
                    <td>The mean of all similarity metrics, giving an overall indication of document similarity. Higher percentages suggest a greater likelihood of content overlap.</td>
                </tr>
            </tbody>
        </table>

        <div style="margin-top: 30px; color: #6b7280; font-size: 12px; text-align: center;">
            <p>Generated by DocSimilarity - PDF Document Similarity Analysis Tool</p>
        </div>
    </body>
    </html>
    """

    return html_content
