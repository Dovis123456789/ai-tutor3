import uuid
import os
import json
import re
from http import HTTPStatus
import dashscope
from dashscope import Generation
from dotenv import load_dotenv


class AITutor:
    def __init__(self):
        self.session_id = str(uuid.uuid4())
        self.current_worksheet = None
        self.chat_history = []   # 最多保留200条消息

    def _call_qwen(self, messages, temperature=0.7, max_tokens=1000):
        import os
        # 临时硬编码（上线后务必改回环境变量）
        dashscope.api_key = "sk-9f6558ca077a481fa54d52e15c863146"
        
        response = Generation.call(
            model='qwen-turbo',
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            result_format='message'
        )
        if response.status_code == HTTPStatus.OK:
            return response.output.choices[0].message.content.strip()
        else:
            return f"❌ AI 调用失败：{response.code} - {response.message}"
            
    def chat(self, prompt):
        try:
            messages = [
                {"role": "system", "content": "你是一个耐心、有趣的AI家教。"},
                {"role": "user", "content": prompt}
            ]
            return self._call_qwen(messages, temperature=0.7)
        except Exception as e:
            return f"AI调用失败：{str(e)}"

    def generate_worksheet(self, topic, difficulty, num, grade=None):
        grade_text = f"，年级：{grade}" if grade else ""
        prompt = (
            f"请生成{num}道关于「{topic}」的练习题，难度：{difficulty}{grade_text}。"
            f"每道题单独成行，格式：1. 题目内容。不要输出答案，只输出题目。"
        )
        q_messages = [
            {"role": "system", "content": "你是一个专业的出题老师，只输出题目列表，不带答案。"},
            {"role": "user", "content": prompt}
        ]
        questions_text = self._call_qwen(q_messages, temperature=0.8, max_tokens=1500)
        questions = [q.strip() for q in questions_text.split("\n") if q.strip()]

        a_prompt = f"这是刚才的练习题：\n{questions_text}\n请给出每道题的标准答案，按题目顺序，格式：1. 答案"
        a_messages = [
            {"role": "system", "content": "你是一个专业的出题老师，只输出标准答案，与题目一一对应。"},
            {"role": "user", "content": a_prompt}
        ]
        answers_text = self._call_qwen(a_messages, temperature=0.5, max_tokens=1500)
        answers = [a.strip() for a in answers_text.split("\n") if a.strip()]

        while len(answers) < len(questions):
            answers.append("（答案缺失）")
        answers = answers[:len(questions)]

        return {
            "title": f"{topic} 练习",
            "questions": questions,
            "answers": answers
        }

    def grade_homework(self, subject, grade_level, homework_content):
        prompt = (
            f"请批改以下学生作业（科目：{subject}，年级：{grade_level}）：\n{homework_content}\n"
            "要求：\n"
            "1. 题目保留学生提交的原完整文字，不要缩写也不要使用“题目1”等占位符。\n"
            "2. 用热情鼓励的语气写评语。\n"
            "3. 返回JSON，包含字段：score、total_score、comment、mistakes（数组，每项含question、wrong_answer、correct_answer、knowledge_point、error_type、solution）、all_solutions。\n"
            "4. solution字段请用分步列出，每步用换行分隔，不要用“1. 2.”这类序号，由系统统一格式化。\n"
            "只输出JSON。"
        )
        messages = [
            {"role": "system", "content": "你是一位温柔又专业的批改老师，擅长鼓励学生，并输出清晰的解题步骤。题目标题必须保留原始完整文字。"},
            {"role": "user", "content": prompt}
        ]
        try:
            raw = self._call_qwen(messages, temperature=0.5, max_tokens=2000)
            raw = raw.replace("```json", "").replace("```", "").strip()
            result = json.loads(raw)
            if result.get("total_score", 0) == 0:
                result["total_score"] = 100
            return result
        except:
            return {
                "score": 0,
                "total_score": 100,
                "comment": "你真的很认真！不过批改解析出了点小问题，我们再试一次吧～",
                "mistakes": [],
                "all_solutions": []
            }

    def generate_similar_question(self, question, correct_answer):
        base_question = question.strip()
        if "=" in base_question:
            base_question = base_question.split("=")[0].strip()

        prompt = (
            f"请根据以下题目生成一道同类型的题目，要求改变场景、数字、结构或解题思路，而不仅仅是替换数值。\n"
            f"原题：{base_question}\n"
            f"正确答案：{correct_answer}\n"
            f"新题目（只输出题目本身，不要答案，不要加“= ?”等额外标记，直接写题目）："
        )
        messages = [
            {"role": "system", "content": "你是一个出题助手。你只生成题目文字，严禁输出答案、解析、或任何额外文字。题目末尾不要加“= ?”之类的标记。"},
            {"role": "user", "content": prompt}
        ]

        for attempt in range(3):
            result = self._call_qwen(messages, temperature=0.9 + attempt * 0.1, max_tokens=200)
            result = re.sub(r'\n?正确答案[：:].*', '', result, flags=re.IGNORECASE)
            result = re.sub(r'\n?答案[：:].*', '', result, flags=re.IGNORECASE)
            result = re.sub(r'\s*=\s*\??$', '', result)
            result = result.strip().rstrip('。').rstrip('.')
            if len(result) > 3 and re.search(r'[0-9\u4e00-\u9fff]', result):
                if not result.endswith('?') and not result.endswith('？'):
                    result += '？'
                return result

        return f"类似：{base_question}？"

    def clear_memory(self):
        self.chat_history = []