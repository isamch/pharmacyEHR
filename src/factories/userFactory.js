import faker from "faker"; 
import User from "../models/User.js";

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




export const createFakeUser = async (overrides = {}) => {

  const user = new User({
    name: overrides.name || faker.name.fullName(),
    email: overrides.email || faker.internet.email(),
    password: overrides.password || "123456", 
    verified: overrides.verified || false,
  });

  await user.save();
  return user;
};
