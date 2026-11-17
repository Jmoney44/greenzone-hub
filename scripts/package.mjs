// Zips the built site (dist/) into greenzone-hub-upload.zip, ready to extract into public_html.
import { execFileSync } from "child_process";
import { existsSync, rmSync } from "fs";

const out = "greenzone-hub-upload.zip";
if (!existsSync("dist/index.html")) throw new Error("Run the build first: dist/index.html is missing.");
rmSync(out, { force: true });
execFileSync("zip", ["-qr", `../${out}`, "."], { cwd: "dist", stdio: "inherit" });
console.log(`Created ${out}`);
