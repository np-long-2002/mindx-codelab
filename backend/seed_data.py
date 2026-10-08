from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.problem import Problem, TestCase
from app.core.security import get_password_hash

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "teacher@mindx.edu.vn").first():
            print("Database already contains seed data.")
            return

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
        db.flush()

        print("Seeding problems...")

        # Problem 1
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
            author_id=teacher.id
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
            author_id=teacher.id
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
            author_id=teacher.id
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
        print("Seed data created successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    seed()

