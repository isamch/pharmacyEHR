import faker from "faker"; 
import __NAME__ from "../models/__NAME__.js";

// Faker Examples:
// faker.name.firstName();   // الاسم الأول
// faker.name.lastName();    // الاسم الأخير
// faker.name.fullName();    // الاسم الكامل
// faker.name.jobTitle();    // المسمى الوظيفي
// faker.name.prefix();      // مثل Mr., Mrs.
// faker.name.suffix();      // مثل Jr., Sr.
// faker.internet.email();       // بريد إلكتروني
// faker.internet.userName();    // اسم مستخدم
// faker.internet.password();    // كلمة مرور
// faker.internet.url();         // رابط موقع
// faker.internet.avatar();      // رابط صورة شخصية

export const createFake__NAME__ = async () => {
  const item = new __NAME__({

    name: faker.name.fullName(),
    email: faker.internet.email(),

  });

  await item.save();
  return item;
};
