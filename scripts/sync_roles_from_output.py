#!/usr/bin/env python3
"""
Sync Roles from JourKa Output
Mengekstrak data karier nyata dari hasil scraping & sintesis AI di JourKa/Output/
dan menyinkronkannya otomatis ke jourka-frontend/src/data/roles.json
"""

import os
import glob
import re
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BASE_DIR, 'JourKa', 'Output')
TARGET_JSON = os.path.join(BASE_DIR, 'jourka-frontend', 'src', 'data', 'roles.json')

def clean_markdown_formatting(text):
    text = re.sub(r'\[[A-Z0-9,\s]+\]', '', text) # Remove citations like [J01, J03]
    text = re.sub(r'[*_`#]', '', text)          # Remove markdown asterisks, bold, etc.
    text = re.sub(r'\s+', ' ', text)            # Normalize spaces
    return text.strip()

def sync_roles():
    print(f"Scanning Output directory: {OUTPUT_DIR}")
    if not os.path.exists(OUTPUT_DIR):
        print(f"Directory {OUTPUT_DIR} does not exist!")
        return

    roles = []
    majors_dict = {
        "ti": {
            "id": "ti",
            "name": "Teknik Informatika / Ilmu Komputer",
            "type": "S1 Akademik / D4 Terapan",
            "top_match_dimensions": ["I", "R"],
            "description": "Mempelajari algoritma, rekayasa perangkat lunak, arsitektur sistem, dan AI untuk membangun platform digital.",
            "key_subjects": ["Struktur Data & Algoritma", "Pemrograman Native & Web", "Basis Data", "Jaringan & Keamanan"],
            "career_links": []
        },
        "dkv": {
            "id": "dkv",
            "name": "Desain Komunikasi Visual (DKV) & Media",
            "type": "S1 Akademik / D4 Vokasi",
            "top_match_dimensions": ["A", "R"],
            "description": "Mengolah cerita dan pesan visual melalui video editing, motion graphics, ilustrasi digital, dan branding.",
            "key_subjects": ["Digital Video Editing", "Tipografi & Estetika", "Audio Visual Storytelling", "Motion Design"],
            "career_links": []
        },
        "farmasi": {
            "id": "farmasi",
            "name": "Farmasi & Farmakologi Klinis",
            "type": "S1 Farmasi + Program Profesi",
            "top_match_dimensions": ["I", "S", "C"],
            "description": "Mempelajari formulasi obat, biokimia medis, pelayanan resep klinis, serta kepatuhan regulasi BPOM/Kemenkes.",
            "key_subjects": ["Kimia Farmasi", "Farmakologi & Toksikologi", "Teknologi Sediaan Obat", "Farmasi Rumah Sakit"],
            "career_links": []
        },
        "si": {
            "id": "si",
            "name": "Sistem Informasi & Bisnis Digital",
            "type": "S1 Akademik",
            "top_match_dimensions": ["I", "E", "C"],
            "description": "Menghubungkan proses bisnis modern dengan solusi arsitektur teknologi informasi dan manajemen data.",
            "key_subjects": ["Analisis & Desain Sistem", "Manajemen Proyek TI", "Enterprise Architecture", "E-Commerce Strategy"],
            "career_links": []
        }
    }

    for role_dir in sorted(glob.glob(os.path.join(OUTPUT_DIR, '*'))):
        if not os.path.isdir(role_dir):
            continue
        role_name = os.path.basename(role_dir)
        id_md = os.path.join(role_dir, f"{role_name} - ID.md")
        html_file = f"{role_name} - ID.html"
        pdf_file = f"{role_name} - ID.pdf"
        
        has_html = os.path.exists(os.path.join(role_dir, html_file))
        has_pdf = os.path.exists(os.path.join(role_dir, pdf_file))
        
        brief = "Membangun dan mengembangkan solusi teknologi dan sistem digital yang andal."
        degree_verdict = "S1/D4 Sangat Dianjurkan (Bisa Jalur Portofolio)"
        salary = "Rp 5.500.000 - Rp 9.000.000 (Entry-Level)"
        related_majors = ["Teknik Informatika", "Sistem Informasi"]
        alt_pathway = "Bootcamp Intensif + Portofolio Mandiri"

        if os.path.exists(id_md):
            with open(id_md, 'r', encoding='utf-8') as f:
                content = f.read()

            # 1. Brief Description (Section 1)
            sec1_match = re.search(r'## 1\.\s*Deskripsi Peran.*?\n\n(.*?)(?=\n\n###|\n\n##|\Z)', content, re.DOTALL)
            if sec1_match:
                raw_desc = clean_markdown_formatting(sec1_match.group(1))
                sentences = [s.strip() for s in raw_desc.split('. ') if s.strip()]
                if len(sentences) >= 2:
                    brief = '. '.join(sentences[:2]) + '.'
                elif sentences:
                    brief = sentences[0] + '.'

            # 2. Degree Verdict (Section 1)
            deg_match = re.search(r'### Pendidikan & Gelar.*?\n(.*?)(?=\n\n###|\n\n##|\Z)', content, re.DOTALL)
            if deg_match:
                deg_text = deg_match.group(1)
                if 'Wajib' in deg_text or 'Regulasi' in deg_text:
                    degree_verdict = "S1 Formal + Profesi (Wajib Regulasi)"
                elif 'Sangat Direkomendasikan' in deg_text or 'Sangat Dianjurkan' in deg_text:
                    degree_verdict = "S1/D4 Sangat Diutamakan"
                elif 'Opsional' in deg_text:
                    degree_verdict = "Gelar Opsional (Portfolio Prioritas)"

            # 3. Salary Range (Section 5)
            sec5_match = re.search(r'## 5\.\s*Estimasi Gaji.*?\n(.*?)(?=\n\n##|\Z)', content, re.DOTALL)
            if sec5_match:
                sal_table = re.findall(r'IDR\s*([0-9\.,]+)\s*[–-]\s*([0-9\.,]+)', sec5_match.group(1))
                if sal_table:
                    min_sal, max_sal = sal_table[0]
                    salary = f"Rp {min_sal} - Rp {max_sal} (Entry-Level)"

        # RIASEC weights mapping based on domain keywords
        lower = role_name.lower()
        slug = re.sub(r'[^a-z0-9]+', '-', lower).strip('-')

        if 'video' in lower or 'editor' in lower:
            riasec = { "R": 0.5, "I": 0.2, "A": 0.9, "S": 0.2, "E": 0.3, "C": 0.2 }
            pref_env = ["creative_studio", "remote_flexible"]
            pref_path = ["vokasi_politeknik", "bootcamp_training", "direct_work"]
            related_majors = ["Desain Komunikasi Visual (DKV)", "Animasi & Media Kreatif"]
            alt_pathway = "Kursus Editing (Premiere/DaVinci) + Showreel YouTube/Behance"
            majors_dict["dkv"]["career_links"].append(role_name)
        elif 'apoteker' in lower or 'farmasi' in lower:
            riasec = { "R": 0.3, "I": 0.8, "A": 0.1, "S": 0.7, "E": 0.2, "C": 0.7 }
            pref_env = ["structured_lab", "corporate_business"]
            pref_path = ["s1_academic"]
            related_majors = ["Farmasi (S1)", "Biologi Medis"]
            alt_pathway = "D3 Farmasi untuk posisi Tenaga Teknis Kefarmasian (TTK)"
            majors_dict["farmasi"]["career_links"].append(role_name)
        elif 'kotlin' in lower or 'multiplatform' in lower:
            riasec = { "R": 0.4, "I": 0.85, "A": 0.1, "S": 0.1, "E": 0.2, "C": 0.4 }
            pref_env = ["remote_flexible", "corporate_business"]
            pref_path = ["s1_academic", "vokasi_politeknik"]
            related_majors = ["Teknik Informatika", "Ilmu Komputer"]
            alt_pathway = "Spesialisasi Android Developer mendalami JetBrains KMP & Compose"
            majors_dict["ti"]["career_links"].append(role_name)
        else: # Software & Mobile engineers
            riasec = { "R": 0.4, "I": 0.8, "A": 0.2, "S": 0.1, "E": 0.2, "C": 0.3 }
            pref_env = ["remote_flexible", "corporate_business"]
            pref_path = ["s1_academic", "vokasi_politeknik", "bootcamp_training"]
            related_majors = ["Teknik Informatika", "Rekayasa Perangkat Lunak", "Sistem Informasi"]
            alt_pathway = "Google Bangkit Academy / Bootcamp Mobile + Portofolio Play Store & GitHub"
            majors_dict["ti"]["career_links"].append(role_name)

        role_obj = {
            "id": slug,
            "title": role_name,
            "riasec_weights": riasec,
            "preferred_env": pref_env,
            "preferred_pathways": pref_path,
            "degree_verdict": degree_verdict,
            "salary_idr": salary,
            "brief_desc": brief,
            "related_majors": related_majors,
            "alternative_pathway": alt_pathway,
            "dossier_available": has_html,
            "dossier_html_path": f"{role_name}/{html_file}",
            "dossier_pdf_path": f"{role_name}/{pdf_file}"
        }
        roles.append(role_obj)
        print(f"Synced role: {role_name} -> ID: {slug}")

    # Deduplicate career links in majors
    majors_list = []
    for m in majors_dict.values():
        m["career_links"] = list(dict.fromkeys(m["career_links"])) or ["Software Engineering", "Tech Industry"]
        majors_list.append(m)

    output_payload = {
        "roles": roles,
        "majors": majors_list
    }

    with open(TARGET_JSON, 'w', encoding='utf-8') as f:
        json.dump(output_payload, f, indent=2, ensure_ascii=False)

    print(f"\nSuccessfully generated {len(roles)} roles and {len(majors_list)} majors into {TARGET_JSON}!")

if __name__ == '__main__':
    sync_roles()
