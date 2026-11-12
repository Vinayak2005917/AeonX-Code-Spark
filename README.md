# Croissant - AI-Powered Handwritten Answer Sheet Evaluation System

An AI-powered assessment platform designed to automate the evaluation of handwritten student answer scripts. The system integrates Handwriting Recognition (OCR), question-wise answer extraction, semantic analysis and rubric-based grading to generate structured evaluations and marks.

It aims to reduce manual evaluation effort, improve grading consistency and provide teachers with an efficient review and verification workflow.

## Overview

Traditional examination evaluation involves manually reading, analysing and grading handwritten answer scripts, making it time-consuming for teachers.
Croissant streamlines this process using an AI-powered pipeline combining Handwriting Recognition (OCR), NLP and semantic analysis.It extracts question-wise answers, evaluates them against reference answers and marking rubrics, and generates suggested scores for teacher verification.
The system aims to reduce manual effort, improve grading consistency and accelerate subjective assessment.

## Problem Statement

Teachers spend considerable time manually checking handwritten student answer sheets. Evaluating answers, comparing them with reference answers and assigning marks becomes difficult when handling large numbers of students.
The project aims to develop an AI-powered system that reads and evaluates handwritten answers, assigns marks based on correctness, awards partial credit for partially correct answers, and suggests scores for teacher verification. This reduces evaluation time and workload while improving grading consistency.

## Objectives

1. **Automated Handwriting Recognition:** Extract handwritten text from student answer sheets using OCR.
2. **Question-wise Answer Extraction:** Identify and map student responses to their corresponding questions.
3. **Intelligent Answer Evaluation:** Evaluate answers against reference answers using semantic analysis and predefined marking rubrics.
4. **Automated Grading with Partial Credits:** Assign marks based on correctness, award partial credit for partially correct answers and generate evaluation feedback.
5. **Human-in-the-Loop Learning:** Incorporate teacher corrections and verified evaluations as feedback to improve the model's future predictions and grading performance.
6. **Efficient and Consistent Assessment:** Reduce manual evaluation time, maintain grading consistency and enable teachers to review and finalize AI-generated results.

## Key Features

1. **Handwritten Answer Recognition (OCR):** Extract text from scanned handwritten student answer scripts.
2. **Question-wise Answer Segmentation:** Identify individual questions and associate their corresponding answers, even across multiple pages.
3. **Reference Answer Matching:** Compare extracted student responses against the official answer key and reference answers.
4. **Semantic Answer Evaluation:** Assess conceptual correctness and meaning rather than relying solely on exact keyword matching.
5. **Rubric-based Grading:** Evaluate answers against predefined marking criteria and allocate marks accordingly.
6. **Partial Credit Allocation:** Award marks for partially correct answers based on the correctness of individual concepts and evaluation criteria.
7. **Multi-format Content Recognition:** Handle handwritten text, mathematical equations, diagrams and tables in answer scripts.
8. **Automated Marks Generation:** Generate question-wise scores, criterion-level marks and total marks.
9. **Teacher Review and Validation:** Allow teachers to review, modify and approve AI-generated evaluations.
10. **Human-in-the-Loop Learning:** Use teacher-verified corrections and evaluations as feedback to improve future model performance.
11. **Evaluation Comparison:** Compare AI-generated marks against teacher-assigned marks to measure grading accuracy and consistency.

## Technology Stack

Croissant uses a combination of Python-based technologies, machine learning frameworks and web development tools to build an automated answer-sheet evaluation pipeline.
Each technology serves a specific purpose, ranging from PDF processing and handwriting recognition to semantic answer evaluation, rubric-based grading and result generation.

The technology stack is organised around the following components:
* **Document Processing:** Handling uploaded answer sheets and converting PDF pages into processable images.
* **Handwriting Recognition:** Extracting handwritten content using OCR models.
* **Answer Evaluation:** Analysing extracted responses and comparing them with reference answers.
* **Grading Engine:** Applying marking rubrics, assigning scores and calculating partial credits.
* **Human-in-the-Loop:** Incorporating teacher feedback and verified evaluations to improve model performance.
* **Application Layer:** Managing data, processing requests and presenting evaluation results.

| Feature / Component | Technology Stack |
|---|---|
| Programming Language | Python |
| PDF Processing | PyMuPDF, pdf2image |
| Image Preprocessing | OpenCV, Pillow |
| Handwriting Recognition (OCR) | Trained OCR Model, PyTorch |
| Question-wise Answer Extraction | Python, NLP |
| Semantic Answer Evaluation | Sentence Transformers |
| Reference Answer Matching | Embedding Similarity, Cosine Similarity |
| Rubric-based Grading | Python, Rule-based Scoring Engine |
| Partial Credit Allocation | Weighted Scoring Algorithm |
| Human-in-the-Loop Learning | Teacher Feedback, Model Fine-tuning |
| Data Storage | SQLite / PostgreSQL |
| Backend API | FastAPI |
| Frontend | React.js |
| Performance Evaluation | scikit-learn, Pandas, NumPy |
| Version Control | Git, GitHub |


