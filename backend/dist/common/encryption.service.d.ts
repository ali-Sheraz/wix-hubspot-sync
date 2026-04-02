import { ConfigService } from '@nestjs/config';
export declare class EncryptionService {
    private readonly configService;
    private readonly algorithm;
    private readonly key;
    constructor(configService: ConfigService);
    encrypt(plaintext: string): string;
    decrypt(ciphertext: string): string;
}
