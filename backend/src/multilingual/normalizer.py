"""Multilingual query normalizer and transliteration helper.
Maps colloquial Hinglish, Marathi, and Tamil phrasing to official municipal gazette terminology
to boost sparse lexical (BM25) and dense vector recall.
"""

import re
from typing import Dict

MUNICIPAL_TERM_MAPPING = {
    r"\b(pani|paani|jal|thanneer|पाणी|पाणीपुरवठा|जल|नल)\b": "water supply tariff pipeline leak",
    r"\b(kachra|kooda|kachara|swachhata|कचरा|कचरापेटी|घाण|स्वच्छता|सफाई)\b": "solid waste sanitation segregation fine penalty",
    r"\b(gaddha|gaddhe|sadak|khadda|खड्डे|खड्डा|रस्ता|रस्ते|सडक)\b": "pothole road repair civil engineering SLA",
    r"\b(kar|tax barna|patta|makan tax|मालमत्ता कर|घरपट्टी|कर|टॅक्स|संपत्ती कर)\b": "property tax assessment rebate Section 128 early bird",
    r"\b(batti|light band|andhera|दिवाबत्ती|स्ट्रीटलाईट|लाईट|विद्युत|बिजली)\b": "streetlight outage electrical feeder repair",
    r"\b(makaan permission|plot pass|naksha pass|बांधकाम|बांधकाम परवानगी|इमारत|नकाशा|परवानगी|सेटबॅक|सेटबॅक्स)\b": "building plan approval OBPAS setback regulations SLA",
    r"\b(chhat|deewar|imarat|भिंत|इमारत कोसळणे|गळती)\b": "building structure life safety emergency collapse",
}


def normalize_query_for_retrieval(query: str) -> str:
    """Augments colloquial or regional phrasing with official statutory keywords."""
    augmented = query
    for pattern, statutory_terms in MUNICIPAL_TERM_MAPPING.items():
        if re.search(pattern, query, re.IGNORECASE):
            augmented += f" {statutory_terms}"
    return augmented.strip()
