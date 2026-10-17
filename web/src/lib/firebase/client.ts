import { getApp, getApps, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

// 로컬 에뮬레이터 모드 (화면 점검·시연 리허설용, 10/17). `npm run dev:emu`로만 켜진다.
// 프로젝트 id를 demo-로 바꿔 실제 Firebase에는 절대 접속하지 않는다.
export const USE_EMULATORS = process.env.NEXT_PUBLIC_EMULATORS === "1";

// 브라우저에서만 쓴다. 개발 서버의 빠른 새로고침에서도 앱을 한 번만 만든다.
export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(
      USE_EMULATORS
        ? {
            ...firebaseConfig,
            projectId: "demo-onkiro",
            authDomain: "demo-onkiro.firebaseapp.com",
            storageBucket: "demo-onkiro.appspot.com",
          }
        : firebaseConfig,
    );

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
// Cloud Functions는 서울 리전에 있다 (functions/src/index.ts)
export const functions = getFunctions(firebaseApp, "asia-northeast3");
// 진단 사진 (storage.rules)
export const storage = getStorage(firebaseApp);

if (USE_EMULATORS && typeof window !== "undefined") {
  const w = window as unknown as {
    __onkiroEmu?: boolean;
    __devSignIn?: (email: string, password: string) => Promise<unknown>;
  };
  if (!w.__onkiroEmu) {
    w.__onkiroEmu = true;
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
    connectStorageEmulator(storage, "127.0.0.1", 9199);
  }
  // 점검 스크립트가 카카오 없이 시연 계정으로 로그인한다 (seed/emulator.seed.test.ts의 계정)
  w.__devSignIn = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);
}
