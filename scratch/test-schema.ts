import { z } from 'zod';
import { createRegistrationSchema } from '../src/lib/validation/registration';

const schema = createRegistrationSchema({
  participationType: 'individual',
  teamMinSize: 1,
  teamMaxSize: 1,
});

const data = {
  idempotencyKey: '123e4567-e89b-12d3-a456-426614174000',
  teamName: '',
  houseId: '',
  notes: '',
  members: [
    {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '0171234567',
      institution: 'DRMC',
      classLevel: '10',
      studentId: ''
    }
  ]
};

const result = schema.safeParse(data);
console.log(JSON.stringify(result, null, 2));
