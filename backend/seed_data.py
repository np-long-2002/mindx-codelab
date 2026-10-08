from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.problem import Problem, TestCase
from app.models.quiz import Quiz, QuizQuestion, QuizOption
from app.core.security import get_password_hash

def seed_users(db):
    teacher = db.query(User).filter(User.email == "teacher@mindx.edu.vn").first()
    if not teacher:
        print("Seeding users...")
        teacher = User(
            email="teacher@mindx.edu.vn",
            full_name="Thầy Hoàng (Giáo viên MindX)",
            hashed_password=get_password_hash("mindx123"),
            role="TEACHER"
        )
        student = User(
            email="student@mindx.edu.vn",
            full_name="Nguyễn Văn An (Học viên)",
            hashed_password=get_password_hash("mindx123"),
            role="STUDENT"
        )
        db.add(teacher)
        db.add(student)
        db.commit()
        db.refresh(teacher)
    return teacher

def seed_problems(db, teacher_id):
    if db.query(Problem).first():
        return

    print("Seeding problems...")
    p1 = Problem(
        title="Tính tổng hai số nguyên",
        slug="tinh-tong-hai-so-nguyen",
        description="""### Đề bài
Cho hai số nguyên $a$ và $b$ nhập từ bàn phím (mỗi số trên một dòng).
Hãy viết chương trình tính và in ra tổng $a + b$.

### Đầu vào (Input)
- Dòng 1: Số nguyên $a$
- Dòng 2: Số nguyên $b$

### Đầu ra (Output)
- In ra một số nguyên duy nhất là tổng của $a$ và $b$.

### Ví dụ
**Input:**
```
5
7
```
**Output:**
```
12
```
""",
        difficulty="EASY",
        starter_code="""# Nhập hai số nguyên từ bàn phím
a = int(input())
b = int(input())

# TODO: Viết code tính tổng và in kết quả ra màn hình
print(a + b)
""",
        solution_guide="Sử dụng hàm input() kết hợp int() để đọc dữ liệu từ bàn phím, sau đó dùng print(a + b).",
        author_id=teacher_id
    )
    db.add(p1)
    db.flush()

    p1_cases = [
        TestCase(problem_id=p1.id, input_data="5\n7", expected_output="12", is_hidden=False, order=1),
        TestCase(problem_id=p1.id, input_data="-3\n10", expected_output="7", is_hidden=False, order=2),
        TestCase(problem_id=p1.id, input_data="0\n0", expected_output="0", is_hidden=False, order=3),
        TestCase(problem_id=p1.id, input_data="99999\n1", expected_output="100000", is_hidden=True, order=4),
        TestCase(problem_id=p1.id, input_data="-50\n-70", expected_output="-120", is_hidden=True, order=5),
    ]
    db.add_all(p1_cases)

    # Problem 2
    p2 = Problem(
        title="Kiểm tra số nguyên tố",
        slug="kiem-tra-so-nguyen-to",
        description="""### Đề bài
Cho một số nguyên dương $n$. Hãy kiểm tra xem $n$ có phải là số nguyên tố hay không.
Số nguyên tố là số nguyên lớn hơn 1 và chỉ chia hết cho 1 và chính nó.

### Đầu vào (Input)
- Một dòng duy nhất chứa số nguyên dương $n$ ($1 \\le n \\le 10^6$).

### Đầu ra (Output)
- In ra `PRIME` nếu $n$ là số nguyên tố.
- In ra `NOT PRIME` nếu $n$ không phải là số nguyên tố.

### Ví dụ
**Input:**
```
7
```
**Output:**
```
PRIME
```
""",
        difficulty="MEDIUM",
        starter_code="""import math

n = int(input())

def is_prime(num):
    if num <= 1:
        return False
    for i in range(2, int(math.isqrt(num)) + 1):
        if num % i == 0:
            return False
    return True

if is_prime(n):
    print("PRIME")
else:
    print("NOT PRIME")
""",
        solution_guide="Kiểm tra các ước từ 2 đến căn bậc hai của n.",
        author_id=teacher_id
    )
    db.add(p2)
    db.flush()

    p2_cases = [
        TestCase(problem_id=p2.id, input_data="7", expected_output="PRIME", is_hidden=False, order=1),
        TestCase(problem_id=p2.id, input_data="4", expected_output="NOT PRIME", is_hidden=False, order=2),
        TestCase(problem_id=p2.id, input_data="1", expected_output="NOT PRIME", is_hidden=False, order=3),
        TestCase(problem_id=p2.id, input_data="2", expected_output="PRIME", is_hidden=False, order=4),
        TestCase(problem_id=p2.id, input_data="97", expected_output="PRIME", is_hidden=True, order=5),
        TestCase(problem_id=p2.id, input_data="100", expected_output="NOT PRIME", is_hidden=True, order=6),
        TestCase(problem_id=p2.id, input_data="997", expected_output="PRIME", is_hidden=True, order=7),
    ]
    db.add_all(p2_cases)

    # Problem 3
    p3 = Problem(
        title="Đảo ngược các từ trong chuỗi",
        slug="dao-nguoc-cac-tu-trong-chuoi",
        description="""### Đề bài
Cho một chuỗi văn bản gồm các từ cách nhau bởi dấu cách.
Hãy đảo ngược thứ tự các từ trong chuỗi đó.

### Đầu vào (Input)
- Một dòng duy nhất chứa chuỗi văn bản.

### Đầu ra (Output)
- In ra chuỗi sau khi đã đảo ngược thứ tự các từ.

### Ví dụ
**Input:**
```
MindX CodeLab Python
```
**Output:**
```
Python CodeLab MindX
```
""",
        difficulty="EASY",
        starter_code="""# Nhập chuỗi văn bản
s = input()

# TODO: Đảo ngược thứ tự các từ và in ra màn hình
words = s.split()
reversed_words = words[::-1]
print(" ".join(reversed_words))
""",
        solution_guide="Sử dụng phương thức split() để tách các từ thành danh sách, sau đó dùng slicing [::-1] và hàm join().",
        author_id=teacher_id
    )
    db.add(p3)
    db.flush()

    p3_cases = [
        TestCase(problem_id=p3.id, input_data="MindX CodeLab Python", expected_output="Python CodeLab MindX", is_hidden=False, order=1),
        TestCase(problem_id=p3.id, input_data="hello world", expected_output="world hello", is_hidden=False, order=2),
        TestCase(problem_id=p3.id, input_data="coding is fun", expected_output="fun is coding", is_hidden=True, order=3),
    ]
    db.add_all(p3_cases)
    db.commit()

def seed_quizzes(db, teacher_id):
    if db.query(Quiz).first():
        return

    print("Seeding quizzes...")
    quiz1 = Quiz(
        title="Trắc nghiệm Python Căn bản & Kiểu dữ liệu",
        description="Bộ câu hỏi trắc nghiệm kiểm tra nền tảng kiến thức biến, toán tử, cú pháp và các kiểu dữ liệu cơ bản trong Python.",
        time_limit_minutes=15,
        author_id=teacher_id
    )
    db.add(quiz1)
    db.flush()

    # Q1
    q1 = QuizQuestion(
        quiz_id=quiz1.id,
        question_text="Trong Python 3, kết quả trả về của hàm `type(5 / 2)` là gì?",
        code_snippet=None,
        explanation="Trong Python 3, toán tử `/` luôn thực hiện phép chia thực và trả về kiểu float. Phép chia lấy phần nguyên là `//`.",
        order=1
    )
    db.add(q1)
    db.flush()
    db.add_all([
        QuizOption(question_id=q1.id, option_text="<class 'int'>", is_correct=False, order=1),
        QuizOption(question_id=q1.id, option_text="<class 'float'>", is_correct=True, order=2),
        QuizOption(question_id=q1.id, option_text="<class 'double'>", is_correct=False, order=3),
        QuizOption(question_id=q1.id, option_text="<class 'number'>", is_correct=False, order=4),
    ])

    # Q2
    q2 = QuizQuestion(
        quiz_id=quiz1.id,
        question_text="Tên biến nào sau đây là KHÔNG HỢP LỆ trong ngôn ngữ Python?",
        code_snippet=None,
        explanation="Trong Python, tên biến không được phép bắt đầu bằng số (ví dụ: `2nd_number` là sai cú pháp).",
        order=2
    )
    db.add(q2)
    db.flush()
    db.add_all([
        QuizOption(question_id=q2.id, option_text="_variable_name", is_correct=False, order=1),
        QuizOption(question_id=q2.id, option_text="total_score", is_correct=False, order=2),
        QuizOption(question_id=q2.id, option_text="2nd_number", is_correct=True, order=3),
        QuizOption(question_id=q2.id, option_text="python_class", is_correct=False, order=4),
    ])

    # Q3
    q3 = QuizQuestion(
        quiz_id=quiz1.id,
        question_text="Đoạn code sau đây sẽ in ra màn hình kết quả gì?",
        code_snippet="""nums = [10, 20, 30, 40, 50]
print(nums[1:4])""",
        test_cases=[
            {"input": "", "expected": "[20, 30, 40]"}
        ],
        explanation="Cú pháp slicing nums[1:4] lấy các phần tử từ chỉ số index 1 đến index 3 (trước index 4), tức là [20, 30, 40].",
        order=3
    )
    db.add(q3)
    db.flush()
    db.add_all([
        QuizOption(question_id=q3.id, option_text="[10, 20, 30]", is_correct=False, order=1),
        QuizOption(question_id=q3.id, option_text="[20, 30, 40]", is_correct=True, order=2),
        QuizOption(question_id=q3.id, option_text="[20, 30, 40, 50]", is_correct=False, order=3),
        QuizOption(question_id=q3.id, option_text="[10, 20, 30, 40]", is_correct=False, order=4),
    ])

    # Q4
    q4 = QuizQuestion(
        quiz_id=quiz1.id,
        question_text="Kiểu dữ liệu nào dưới đây là Immutable (bất biến, không thể sửa đổi sau khi tạo)?",
        code_snippet=None,
        explanation="Tuple trong Python là kiểu dữ liệu bất biến (immutable), không thể thay đổi phần tử sau khi khởi tạo.",
        order=4
    )
    db.add(q4)
    db.flush()
    db.add_all([
        QuizOption(question_id=q4.id, option_text="list", is_correct=False, order=1),
        QuizOption(question_id=q4.id, option_text="dict", is_correct=False, order=2),
        QuizOption(question_id=q4.id, option_text="set", is_correct=False, order=3),
        QuizOption(question_id=q4.id, option_text="tuple", is_correct=True, order=4),
    ])

    # Q5
    q5 = QuizQuestion(
        quiz_id=quiz1.id,
        question_text="Kết quả của đoạn chương trình Python sau là gì?",
        code_snippet="""def power(x, y=2):
    return x ** y

print(power(3) + power(2, 3))""",
        test_cases=[
            {"input": "", "expected": "17"}
        ],
        explanation="power(3) sử dụng tham số mặc định y=2 -> 3**2 = 9. power(2, 3) tính 2**3 = 8. Tổng là 9 + 8 = 17.",
        order=5
    )
    db.add(q5)
    db.flush()
    db.add_all([
        QuizOption(question_id=q5.id, option_text="15", is_correct=False, order=1),
        QuizOption(question_id=q5.id, option_text="17", is_correct=True, order=2),
        QuizOption(question_id=q5.id, option_text="12", is_correct=False, order=3),
        QuizOption(question_id=q5.id, option_text="Lỗi TypeError", is_correct=False, order=4),
    ])

    # Quiz 2
    quiz2 = Quiz(
        title="Trắc nghiệm Cấu trúc Điều khiển & Vòng lặp",
        description="Luyện tập câu lệnh if-else, vòng lặp for, while và các từ khóa break, continue trong Python.",
        time_limit_minutes=10,
        author_id=teacher_id
    )
    db.add(quiz2)
    db.flush()

    # Q2.1
    q2_1 = QuizQuestion(
        quiz_id=quiz2.id,
        question_text="Từ khóa nào dùng để bỏ qua lần lặp hiện tại và chuyển sang lần lặp kế tiếp trong vòng lặp?",
        code_snippet=None,
        explanation="Từ khóa `continue` dùng để bỏ qua các lệnh còn lại của vòng lặp hiện tại và nhảy sang lần lặp tiếp theo. `break` sẽ thoát hẳn khỏi vòng lặp.",
        order=1
    )
    db.add(q2_1)
    db.flush()
    db.add_all([
        QuizOption(question_id=q2_1.id, option_text="pass", is_correct=False, order=1),
        QuizOption(question_id=q2_1.id, option_text="break", is_correct=False, order=2),
        QuizOption(question_id=q2_1.id, option_text="continue", is_correct=True, order=3),
        QuizOption(question_id=q2_1.id, option_text="skip", is_correct=False, order=4),
    ])

    # Q2.2
    q2_2 = QuizQuestion(
        quiz_id=quiz2.id,
        question_text="Đoạn code sau đây sẽ in ra bao nhiêu số?",
        code_snippet="""for i in range(1, 10, 2):
    print(i)""",
        test_cases=[
            {"input": "", "expected": "1\n3\n5\n7\n9"}
        ],
        explanation="Hàm range(1, 10, 2) sinh ra dãy số: 1, 3, 5, 7, 9 (tổng cộng 5 số).",
        order=2
    )
    db.add(q2_2)
    db.flush()
    db.add_all([
        QuizOption(question_id=q2_2.id, option_text="4", is_correct=False, order=1),
        QuizOption(question_id=q2_2.id, option_text="5", is_correct=True, order=2),
        QuizOption(question_id=q2_2.id, option_text="9", is_correct=False, order=3),
        QuizOption(question_id=q2_2.id, option_text="10", is_correct=False, order=4),
    ])

    db.commit()

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        teacher = seed_users(db)
        seed_problems(db, teacher.id)
        seed_quizzes(db, teacher.id)
        print("Seed data completed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
