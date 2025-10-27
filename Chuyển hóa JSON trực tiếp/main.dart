import 'dart:convert';

void main() {
  // Chuỗi JSON ban đầu (giống như dữ liệu trả về từ API)
  String jsonString = '{"name": "Nguyen Trong Nhan", "age": 21, "email": "nhannt.miya@gmail.com"}';

  // Giải mã
  Map<String, dynamic> userMap = jsonDecode(jsonString);
  print('Tên: ${userMap['name']}');
  print('Tuổi: ${userMap['age']}');
  print('Email: ${userMap['email']}');

  // Mã hóa
  String jsonStringEncode = jsonEncode(userMap);
  print(jsonStringEncode);
}