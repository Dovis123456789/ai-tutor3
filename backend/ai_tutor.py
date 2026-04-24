import uuid
import os
import json
import re
from http import HTTPStatus
import dashscope
from dashscope import Generation
from dotenv import load_dotenv

load_dotenv()
dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")

class AITutor:
    def __init__(self):
        self.session_id = str(uuid.uuid4())
        self.current_worksheet = None
        self.mistakes = []
        self.chat_history = []   # 最多保留200条消息（100轮对话）

    # ---------- 通用调用 ----------
    def _call_qwen(self, messages, temperature=0.7, max_tokens=1000):
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

    # ---------- 普通对话（带记忆） ----------
    def chat(self, prompt):
        system_prompt = {
            "role": "system",
            "content": (
                "你是一个耐心、有趣的AI家教，专门给中小学生辅导功课。"
                "用中文回答，语气亲切温暖。\n"
                "【重要规则】\n"
                "1. 如果学生发送的是一道题目（例如算式、应用题等），你要先鼓励学生自己尝试思考，可以给予启发或提示，但不要直接给出答案。"
                "只有当学生明确表达‘不会’、‘请解答’、‘答案是什么’等请求时，你才可以给出答案。\n"
                "2. 你绝对不能主动给学生出题，即使学生已经答对了当前题目，也不可以主动询问‘要不要再来一题’。"
                "只有当学生明确要求‘再出一道题’或‘来点练习’时，你才可以出新题。"
            )
        }

        messages = [system_prompt]
        recent_history = self.chat_history[-200:]
        messages.extend(recent_history)
        messages.append({"role": "user", "content": prompt})

        reply = self._call_qwen(messages, temperature=0.7)

        self.chat_history.append({"role": "user", "content": prompt})
        self.chat_history.append({"role": "assistant", "content": reply})
        if len(self.chat_history) > 200:
            self.chat_history = self.chat_history[-200:]

        return reply

    # ---------- 生成作业 ----------
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

    # ---------- 批改作业 ----------
    def grade_homework(self, subject, grade_level, homework_content):
        prompt = (
            f"请严格批改以下学生提交的作业内容，不要添加任何额外题目。科目：{subject}，年级：{grade_level}。\n"
            f"学生作业：\n{homework_content}\n"
            "要求：\n"
            "1. 只批改学生实际提交的题目，不得自行生成新题。\n"
            "2. 生成一个JSON，包含：score（分数，0-100分，根据错误题数占总题数的比例扣分，满分100）、total_score（固定为100）、comment（简短有趣的评语）。\n"
            "3. mistakes数组：只包含学生做错的题目。每项包含question（原题）、wrong_answer（学生错误答案）、correct_answer（正确答案）、knowledge_point（知识点）、error_type（计算错误/概念错误等）。如果某题学生答对了，不要放进mistakes。\n"
            "4. 如果所有题都正确，mistakes为空数组，score为100。\n"
            "只输出JSON，不要任何解释。"
        )
        messages = [
            {"role": "system", "content": "你是一个严谨的批改助手，严格按JSON格式输出，只收录错题。"},
            {"role": "user", "content": prompt}
        ]
        try:
            raw = self._call_qwen(messages, temperature=0.3)
            raw = raw.replace("```json", "").replace("```", "").strip()
            result = json.loads(raw)
            if result.get("total_score", 0) == 0:
                result["total_score"] = 100
            return result
        except:
            return {
                "score": 0,
                "total_score": 100,
                "comment": "批改解析失败，请重试。",
                "mistakes": []
            }

    # ---------- 生成相似题（彻底修复：只出题目，不带答案） ----------
    def generate_similar_question(self, question, correct_answer):
        # 1. 从原题中提取基础题目（去掉等号和错误答案，如 "1+1=3" -> "1+1"）
        base_question = question.strip()
        # 尝试移除等号及后面的任何内容
        if "=" in base_question:
            base_question = base_question.split("=")[0].strip()

        prompt = (
            f"请根据以下题目生成一道同类型的题目，只输出题目本身，以“ = ?”结尾，不要输出答案。\n"
            f"原题：{base_question}\n"
            f"相似题："
        )
        messages = [
            {
                "role": "system",
                "content": (
                    "你是一个出题助手。你根据给定的题目生成一道类似但不同数字的题目。"
                    "要求：1. 只输出题目本身，比如“3 + 5 = ?”。2. 不要输出答案。3. 不要输出任何解释。"
                )
            },
            {"role": "user", "content": prompt}
        ]
        result = self._call_qwen(messages, temperature=0.8)

        # 2. 后处理：进一步去除可能泄露的答案
        # 删除类似“正确答案：xxx”的行
        result = re.sub(r'\n?正确答案[：:].*', '', result, flags=re.IGNORECASE)
        result = re.sub(r'\n?答案[：:].*', '', result, flags=re.IGNORECASE)
        # 如果结尾是“= 数字”，去掉数字，改为“= ?”
        result = re.sub(r'=\s*\d+\.?\s*$', '= ?', result.strip())
        # 确保结尾有“= ?”
        if not result.endswith('= ?'):
            result = result.rstrip() + ' = ?'
        return result.strip()

    # ---------- 错题管理 ----------
    def record_mistake(self, session_id, subject, grade_level, question, wrong_answer, correct_answer, knowledge_point, error_type):
        mistake_id = str(uuid.uuid4())[:8]
        self.mistakes.append([mistake_id, session_id, subject, grade_level, question, wrong_answer, correct_answer, knowledge_point, error_type, 0])

    def get_mistakes(self, session_id, reviewed=None):
        if reviewed is not None:
            return [m for m in self.mistakes if m[-1] == reviewed]
        return self.mistakes

    def mark_reviewed(self, mistake_id):
        for m in self.mistakes:
            if m[0] == mistake_id:
                m[-1] = 1
                return True
        return False

    def get_weekly_report(self, session_id):
        if not self.mistakes:
            return "本周没有错题，表现优秀！"
        mistakes_text = "\n".join([f"- {m[4]}" for m in self.mistakes])
        prompt = f"根据以下错题，生成一份简短的周学习报告，指出薄弱知识点并给出鼓励：\n{mistakes_text}"
        messages = [
            {"role": "system", "content": "你是一个贴心的学习报告生成助手，用温暖的中文写报告，200字以内。"},
            {"role": "user", "content": prompt}
        ]
        return self._call_qwen(messages, max_tokens=500)

    def clear_memory(self):
        self.mistakes = []
        self.chat_history = []