// packages/db owns the Drizzle schema, migrations, and the only code that writes
// published catalog rows into environment databases. It may import Cloudflare D1
// bindings (drizzle-orm/d1), so the core purity boundary does not apply here.
import base from "@cutura/config/eslint";

export default [...base];
