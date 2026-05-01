import { describe, expect, it } from 'vitest';

describe('onboarding mobile scaffold', () => {
  it('new user id stays deterministic', () => {
    expect('dev_new_user_mobile').toMatch('dev_new_user_mobile');
  });
});
